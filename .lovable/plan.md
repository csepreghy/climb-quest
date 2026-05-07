## Boss Defeat Celebration — Redesign

Update `src/components/LogModal.tsx` only.

### 1. Chalk icon consistency
- Both `SimpleCelebrate` and `BossCelebrate` currently use `goldenChalkBagImg`. Switch them to `chalkBagImg` (same icon shown next to chalk balance in the header via `Layout.tsx` / `ChalkChip`).

### 2. Show chalk breakdown in boss defeat modal
- `BossForm.commit("defeat")` currently passes only `total`. Capture the full breakdown from `logBoulder` (`res.log.chalkTotal` + recompute via `computeChalk("boss_send", styles, true, false)` to get `base` + `bonuses`) and pass to `BossCelebrate`.
- Render rows in the modal: Base, each bonus (`+ <source>  +<amount>`), divider, Total. Mirror the styling from `PreviewReward`.

### 3. No auto-close, add "Keep Climbing" button
- Remove the `setTimeout(...)` for the defeat path. Keep auto-close only for the attempt path.
- Add a primary orange `GameButton` "Keep Climbing" inside `BossCelebrate` that calls `onDone` (pass it as a prop).

### 4. Animated boss-defeat scene
Replace the static centered boss image with a left/right composition:

```text
[ Player ]   →→💥←←   [ Boss ]
 (glowing)            (falls off)
```

- Layout: `relative h-64` flex with player on left, boss on right.
- Player: render `<ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />` (use `useGame()` inside `BossCelebrate`). Wrap in a div with a strong orange/gold radial glow + pulse.
- Boss: existing `bossImg` in a bordered tile.
- Animation sequence (CSS keyframes added inline via Tailwind arbitrary values, or new keyframes in `src/index.css`):
  - `player-charge`: 0% rest → 60% slide right + slight scale → 70% impact shake → settles back to original spot.
  - `boss-knockout`: 0–60% idle → 65% flash white + shake → 70–100% translateY(+400px) + rotate(35deg) + fade out.
  - `impact-flash`: white radial flash at the midpoint, 65–80%.
- Chalk impact particles: ~18 small white circle spans bursting from the impact point using existing `animate-chalk-poof` keyframe (already in `index.css`). Each has a random `--dx`/`--dy` and a `1.2s` duration starting at `~0.6s` delay (matching impact). Use `animation-fill-mode: forwards` so they end invisible — no lingering particles after the burst.
- After ~1.4s the scene is static: glowing player on the left, empty space where the boss was, then the breakdown + "Keep Climbing" button appear (`animate-pop-in`).

### Technical notes
- New keyframes go in `src/index.css` under `@layer utilities`: `player-charge`, `boss-knockout`, `impact-flash`. Add matching `.animate-*` classes.
- `BossCelebrate` signature becomes `({ total, breakdown, onDone })`.
- `SimpleCelebrate` keeps its current auto-close behavior (attempts only).
- No store/data changes needed.

### Files touched
- `src/components/LogModal.tsx`
- `src/index.css` (new keyframes only)
