# Streak-friendly daily chalk cap

Soft daily cap that scales with **player level** and **current streak**, with diminishing returns once exceeded (option 4 + 2 hybrid). This rewards consistency without punishing long sessions outright.

## Mechanics

### Daily cap formula
```
dailyCap(level, streakDays) = BASE + LEVEL_STEP × level + STREAK_STEP × min(streakDays, 30)
```
Tunable defaults (admin-configurable):
- `BASE = 100`
- `LEVEL_STEP = 80` (so a level 5 player starts at 500 cap)
- `STREAK_STEP = 25` (extra +25 cap per consecutive day, capped at 30 days → +750)

Net: a fresh lvl 1 player has a 180-chalk cap; a lvl 8 player on a 14-day streak has 100 + 640 + 350 = **1,090** cap; a lvl 10 endgame player on a 30-day streak has 100 + 800 + 750 = **1,650** cap.

### Diminishing returns past cap
Logs continue but pay reduced chalk:
- 0 → 100% of cap: full pay
- 100% → 200% of cap: **50%** pay
- 200%+ of cap: **20%** pay

Applied as a final multiplier in `computeChalk`, after crit, *before* persisting. The breakdown shows a "Daily cap (×0.5)" or "Daily cap (×0.2)" line so users see why a log paid less.

### What counts toward the cap
Sum of `chalkTotal` from all `logs` and `bossAttempts` whose local date matches today (`toDateString()`).

### Streak definition
Already used implicitly via "logged yesterday" — define `currentStreak(s)` as the count of consecutive prior local dates ending today (or yesterday if no log yet today) that have at least one log/boss-attempt.

## UI surfaces

### Log page
- A small **"Daily cap"** progress bar above the log button: `1,243 / 1,650 chalk · streak 14 🔥`.
- Bar color shifts: chalk-glow → orange (over 100%) → muted (over 200%).
- Tooltip explains diminishing returns.

### Log breakdown toast
When a log is reduced, the chalk breakdown surfaces: `"Daily cap reached — ×0.5 chalk"`.

### Inventory "Special" panel
Add a row: `Daily cap — 1,650 chalk (streak 14)`.

## Admin

New section in `/admin` → "Economy" alongside activity rewards:
- Inputs for `BASE`, `LEVEL_STEP`, `STREAK_STEP`, soft-cap multipliers (1×, 0.5×, 0.2×) and threshold breakpoints (100%, 200%).
- Stored in a new `daily_cap_config` row (single-row settings table) so designers can tune without redeploys.
- Toggle to **disable** the cap entirely (default: enabled).

## Rebalance integration

Update `proposeRebalance` activity targets so a "normal" level-appropriate session of ~6 logs lands at roughly 60–70% of cap (full pay), and a heavy 12-log session pushes into the diminished zone but still rewards effort.

## DB changes

New table `daily_cap_config` (single-row, admin-managed):
- `base int`, `level_step int`, `streak_step int`, `streak_max_days int`
- `tier1_threshold numeric`, `tier1_mult numeric`, `tier2_threshold numeric`, `tier2_mult numeric`
- `enabled bool`
- RLS: read for everyone, write for admins.

No changes needed to `user_game_state` — cap is computed client-side from existing logs.

## Files

- `src/game/dailyCap.ts` (new) — `computeDailyCap`, `chalkUsedToday`, `applyDailyCap`, `currentStreak`.
- `src/game/store.ts` — call `applyDailyCap` at the end of `computeChalk` (or wrap at log time so cap is based on persisted total at log moment).
- `src/components/DailyCapBar.tsx` (new) — progress bar component.
- `src/pages/Log.tsx` — render `DailyCapBar`, surface "reduced" toast text.
- `src/pages/Inventory.tsx` — add cap row to Special panel.
- `src/pages/Admin.tsx` — new "Daily cap" settings card.
- DB migration for `daily_cap_config` table + seed default row.

## Out of scope
- Hard caps (logs blocked entirely).
- Per-activity caps.
- Weekly/monthly caps.
- Items that *raise* the daily cap (could be a future "economy mechanic" added to rebalance).
