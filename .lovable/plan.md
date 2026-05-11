## Goal

Give admins a self-serve way to back up and restore a user's `user_game_state` row (game + gyms JSON) without depending on Lovable Cloud's support-only restore.

## What gets built

A new **Snapshots** tab inside the Admin page (alongside General, Account, Users, Levels, etc.).

### Two halves of the UI

**1. Export / Backup**
- Pick a user (defaults to current admin) and slot (`test` or `personal`)
- Shows current row metadata: last updated, log count, level, total chalk
- Buttons:
  - **Download snapshot** — saves `{ user_id, slot, taken_at, game, gyms }` as a `.json` file
  - **Copy JSON** — to clipboard
- An automatic "auto-snapshot on load" toggle that, when on, downloads a snapshot every time the admin loads their personal slot (belt-and-suspenders backup).

**2. Restore from snapshot**
- File picker (`.json`) **or** a paste-into-textarea field
- Validates the JSON shape (must contain `game` and `gyms` objects, optional `user_id`/`slot` for sanity-check)
- Preview panel shows what will change: target slot's current `level` / `logs` / `chalk` vs. the snapshot's
- Two-step confirm (typed "RESTORE" or a checkbox) before write
- Writes via the existing `user_game_state` upsert path so RLS + the new safety guard still apply

### Where the data goes

Restore writes directly to `user_game_state` for the chosen `user_id` + `slot`. No new tables. The safety guard added earlier in `src/game/sync.tsx` will *not* block this because the snapshot is populated.

## Files to touch

- **New** `src/components/admin/SnapshotsAdmin.tsx` — the whole UI
- **Edit** `src/pages/Admin.tsx` — add `<TabsTrigger value="snapshots">` + `<TabsContent value="snapshots">`
- **Edit** `src/game/sync.tsx` — after a successful restore, force-reload the active slot so the in-memory store matches the new remote row (avoids the safety guard then re-saving stale local state)

## Out of scope

- Restoring other users' rows from inside the app — admin can only target their own `user_id` (RLS already prevents cross-user writes). For other users we'd need a SECURITY DEFINER RPC; flag if you want that.
- Server-side scheduled backups — kept manual for now; auto-snapshot toggle is client-side only.
- Diffing two snapshots — out of scope.

## Open question

Do you want this restricted to your own account only (simplest, RLS-safe), or should admins be able to restore any user's row? The latter needs a SECURITY DEFINER function.
