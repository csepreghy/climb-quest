## Strength Tier system (recap)
- Daily qualifier: ≥10 combined reps OR ≥30s combined holds in a day.
- Rolling 7-day window: count qualifying days → Bronze (3–4) / Silver (5–6) / Gold (7).
- Bonus: Bronze +5% / Silver +10% / Gold +15% chalk on every earning (climbing + strength). Gold adds +5% crit.
- No streak reset cliff — tier just recalculates daily.

## Where to show it

### 1. Primary: `DailyCapBar` (Home + Logs)
Add a second strip directly under the existing chalk Streak strip, mirroring its look so the two systems read as siblings.

```text
[Streak strip — already exists]
[Strength Tier strip — NEW]
  💪  STRENGTH TIER · Silver           +10% chalk
  ▣ ▣ ▣ ▣ ▣ ▢ ▢      (5/7 qualifying days, rolling)
  Bronze 3 · Silver 5 · Gold 7
[Daily cap bar — already exists]
```

- 7 segment dots = last 7 calendar days (oldest left → today right). Filled = qualified, hollow = didn't.
- Tier label color: Bronze `hsl(28 70% 55%)`, Silver `hsl(0 0% 82%)`, Gold `hsl(var(--legendary))`.
- Today's segment pulses if not yet qualified, to nudge action.
- Tap the strip → opens "Strength Tier" info modal explaining qualifier, thresholds, and current bonus (reuses the pattern of the existing chalk-streak modal).

This is the main always-visible surface, appearing on Dashboard and Logs page (both already render `DailyCapBar`).

### 2. Dashboard hero — tier chip
Small chip next to the level title in the hero card:
```text
Level 12 · Crimp Master   [💪 Silver +10%]
```
Subtle, but ties the climber identity to current strength form. Tap → same info modal.

### 3. Log Strength flow
Inside the strength `LogModal`, show a one-line tier preview above the submit button:
```text
After today: Silver → Gold  (+5% chalk on next sends)
```
Only shows when logging would actually advance the tier. Pure motivation, no new mechanic.

### 4. Leaderboard
- **Row**: add a tiny tier dot next to the strength sessions stat (uses the tier color, no label, to stay compact). Hover/tap title shows "Strength tier: Gold".
- **Climber details dialog**: add a "Strength Tier" stat tile alongside Logs/Bosses/Strength, showing tier label + 7-day fill (Bronze/Silver/Gold/—).
- Requires `get_leaderboard` and `get_climber_charts` RPCs to compute & return the tier (rolling 7-day qualifier count from each user's strength sessions).

### 5. Strength chart on Dashboard
On `StrengthRepsHoldChart`, draw faint horizontal threshold lines at the 10-reps / 30s qualifier and color each day's bar by whether it qualified. Quick visual feedback on consistency.

## Implementation outline

**New module** `src/game/strengthTier.ts`:
- `qualifiesForDay(sessions, dayISO): boolean` — sum reps + sum hold seconds for that calendar day, check ≥10 reps OR ≥30s.
- `rolling7(sessions, today): { qualifiedDays: number; daysMask: boolean[] }`.
- `tierFor(qualifiedDays): "none" | "bronze" | "silver" | "gold"`.
- `tierBonusPct(tier): number` and `tierCritPct(tier): number`.
- `useStrengthTierConfig()` hook backed by a `strength_tier_config` row (admin-tunable thresholds, same pattern as `useStreakConfig`).

**Wire bonuses into chalk math**: extend the existing chalk multiplier path (same place streak `dayBonus` is applied to log/strength chalk) to also add `tierBonusPct`. Crit chance picks up `tierCritPct` for Gold.

**New component** `src/components/StrengthTierStrip.tsx` — rendered inside `DailyCapBar` below the existing streak strip.

**New component** `src/components/StrengthTierModal.tsx` — info modal.

**Backend**:
- Migration adding `strength_tier_config` (admin-tunable rep/sec qualifiers, percentages).
- Update `get_leaderboard` and `get_climber_charts` SQL functions to return `strength_tier` + `strength_tier_days` per climber, computed from the last 7 days of their strength sessions.

**Admin page** (small): add controls to tune qualifier thresholds and bonus percentages, and a "Trigger Gold tier preview" button for testing (mirrors existing milestone trigger pattern).

## Out of scope (this round)
- Milestone unlocks (Iron title, flex emote) — skipped per your call.
- Reset/grace day passes — tier already degrades gracefully.
