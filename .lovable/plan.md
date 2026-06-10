
# Daily streak revamp + level-scaled chalk

Based on your picks:
- **Streak cycle (weekly):** Days 1–6 → +10% chalk on all earnings that day. Day 7 → +50%.
- **Post-7-day reward:** +20% chalk for 3 days AND +20% crit chance for 7 days (stacked buffs).
- **Counter:** keeps climbing to 30 days. Milestone rewards at 14 / 21 / 30 days (proposed below).
- **Break rule:** miss one day → streak resets to 0. (Today + yesterday safety window stays — the streak ticks at the first log of a new day.)
- **Level-scaled activity chalk:** base reward × level multiplier instead of flat values.

## Streak day bonus (applies to all chalk earned that day)

| Day in 7-cycle | Bonus |
|---|---|
| 1 | +10% |
| 2 | +10% |
| 3 | +10% |
| 4 | +10% |
| 5 | +10% |
| 6 | +10% |
| 7 | +50% |

Day-of-cycle = `((streak - 1) mod 7) + 1`, so Day 7, 14, 21, 28 all hit the +50% payout.

## Milestone rewards (one-shot, when streak first hits the number)

- **Day 14** — "Two-Week Tenacity": +25% chalk buff for 5 days
- **Day 21** — "Three-Week Titan": exclusive cosmetic badge + 1-day cap × 1.5 for a week
- **Day 30** — "Monthly Monk": large Chalk Cache (≈ 2× current daily cap) + permanent leaderboard flair until streak breaks

(All numbers are admin-tunable, same pattern as `daily_cap_config`.)

## Active buffs system

A small `state.activeBuffs[]` array on the game state:
```
{ kind: 'chalk' | 'crit' | 'cap', pct: number, expiresAt: ISO }
```
- Applied inside `computeChalk` (chalk/crit) and `computeDailyCap` (cap).
- Stack additively within a kind, multiplicatively across kinds for chalk.
- Cleaned up lazily on read + on each log.

## Level-scaled activity chalk

Replace flat `BASE_CHALK[activity]` with `BASE_CHALK[activity] × levelMult(level)`:

```
levelMult(level) = 1 + (level - 1) × 0.15   // L1=1.0, L5=1.6, L10=2.35
```

So an L10 climber earns ~2.35× per activity vs L1. Daily cap already scales with level, so this stays balanced. Admin override per-activity stays flat (`activity_rewards` table); the level multiplier is applied on top.

## UI surface

- `DailyCapBar` gets a streak strip above it: 7 day-pips, the current day-bonus %, and any active buffs (with countdown).
- Toast on streak-day rollover ("Day 3! +10% chalk today").
- Toast + small banner on Day 7 completion listing the buffs granted.
- Milestone reaches show a celebratory banner (reuse `LevelUpBanner` styling).

## Technical changes

**DB migration (1 new table, 1 new config column-set):**
- `streak_config` (id='default'): enabled, day_bonus_pcts (jsonb of 7 values), post7_chalk_pct, post7_chalk_days, post7_crit_pct, post7_crit_days, milestone rewards jsonb. RLS: read all-authenticated, write admin-only.
- `user_streak_state` is **not** needed — streak is derived from logs (already is). Active buffs go on existing `user_game_state.game.activeBuffs` (no migration needed).

**Files:**
- `src/game/streak.ts` (new): `streakDayBonusPct(streak, cfg)`, `applyStreakAndBuffs(amount, state)`, `addBuff(state, buff)`, `activeBuffs(state)`, `tickMilestones(state, prevStreak, newStreak)`.
- `src/game/store.ts`: integrate streak bonus + buffs into `computeChalk`; on every successful log, recompute streak before/after and dispatch milestone rewards into `state.activeBuffs` / `state.chalk`.
- `src/game/dailyCap.ts`: factor cap buffs into `computeDailyCap`.
- `src/game/activityRewards.ts` + `data.ts`: add `levelMult(level)` and wire into `getActivityReward(activity, level)`. Update call sites in `store.ts`.
- `src/components/DailyCapBar.tsx`: new streak strip + buff chips.
- `src/components/LogModal.tsx`: preview shows streak bonus + active buffs.
- Admin panel: add a "Streak & Buffs" tab matching the existing daily-cap admin UI.

## What stays the same
- Daily soft cap with diminishing returns (just gets buff-aware).
- Existing admin `activity_rewards` overrides (level mult applies on top).
- Mobile browser / standalone layout work from earlier turns.

Approve and I'll ship it.
