# Separate test and personal accounts in the database

## Problem

Right now `user_game_state` has `PRIMARY KEY (user_id)` — only one row per user. The personal slot was implemented as **localStorage-only**, with the test slot being the only one synced to the backend. That means:

- Personal progress lives only in this browser's localStorage. Clearing storage, switching devices, or any code path that writes to the shared `STORAGE_KEY` can contaminate it (which is what made personal show test data earlier).
- The two accounts are not "separate users in the database" — there is only ever one DB row.

You want both slots to be fully independent records in the backend, both owned by the admin user.

## Solution

Extend `user_game_state` to support multiple slots per user, then sync **both** slots to the DB.

### 1. Schema migration

- Add `slot text not null default 'test'` to `user_game_state`, constrained to `'test' | 'personal'`.
- Drop the existing primary key on `user_id` and replace with composite PK `(user_id, slot)`.
- Update RLS policies to keep the same `auth.uid() = user_id` check (works unchanged for both slots).
- Backfill: existing rows become the `'test'` slot automatically via the default.

### 2. Sync layer (`src/game/sync.tsx`)

- Always load/save by `(user_id, slot)` pair. Both slots go through the backend; remove the localStorage-only branch for the personal slot.
- On mount and on slot change: fetch the row for the active slot, then `replaceGameState` / `replaceGymsState` with it (or empty profile if no row exists yet — a fresh personal account starts at level 1, 0 chalk).
- All subsequent writes upsert into `(user_id, slot)`.
- Drop `adminSeedMockData` auto-seeding for the personal slot — only seed test if it is empty.

### 3. Slot switching (`src/game/adminAccounts.ts`)

- Keep the in-memory active-slot tracking and `useActiveSlot` hook.
- Switching slots no longer reads/writes a localStorage blob; instead it triggers `GameSync` to re-fetch from the backend for the newly-active slot.
- Remove the `climbquest:admin:slot:*` localStorage keys (and clean them up on first run so stale data doesn't leak back in).

### 4. One-time cleanup of contaminated personal data

Because the current personal slot in localStorage is actually a copy of test data, on first load after this change we will:

- Ignore the existing `climbquest:admin:slot:personal:*` blob.
- Let the personal slot start fresh in the DB (empty row created on first switch).

If you want to keep the level-8 progress that's currently showing under "personal", say so and we'll instead seed the new personal DB row from that blob before discarding it.

## Technical details

Migration sketch:

```sql
alter table public.user_game_state
  add column slot text not null default 'test'
  check (slot in ('test','personal'));

alter table public.user_game_state drop constraint user_game_state_pkey;
alter table public.user_game_state add primary key (user_id, slot);
```

Query pattern in `sync.tsx`:

```ts
.from('user_game_state')
.select('game, gyms')
.eq('user_id', uid)
.eq('slot', slot)
.maybeSingle();

.upsert({ user_id, slot, game, gyms }, { onConflict: 'user_id,slot' });
```

Non-admin users always use `slot = 'test'` implicitly, so nothing changes for them.
