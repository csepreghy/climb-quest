## Why box backgrounds look weaker than buttons

Three things make panels read as flatter than the Log Boulder / chalk-chip buttons:

1. **Square corners.** `--radius` is `0rem`, so `.rpg-panel` has hard right-angle corners. Buttons (shadcn) and the chalk chip use rounded/pill shapes, which is most of the "chunky button" feel.
2. **Inner content sits flush.** Buttons have tight padding around a single label; panels have a lot of inner content but no inner radius cue, so the bevel reads as a frame around emptiness instead of wrapping the content.
3. **Bevel highlight is thin** on the default elevation (`inset 0 1px 0 / 0.06`) compared to buttons (`/ 0.18`), so the top edge doesn't catch light.

## Changes

1. **`src/index.css`**
   - `--radius: 0rem` → `0.75rem` so all panels (and shadcn components that use `var(--radius)`) get soft corners.
   - Bump the default `--shadow-panel` top highlight from `0.06` → `0.14` so flat panels still look lit, matching the button family.

2. **`src/components/Layout.tsx` — chalk chip area**
   - Increase the gap between the avatar/level cluster and the chalk chip, and the chip and the theme switcher. Currently the header row is tight; add `gap` / horizontal padding so the chalk bag isn't crowded against its neighbors.
   - Also nudge the chip's internal left padding (`pl-3` → `pl-4`) so the bag icon has air on its left.

3. **`src/theme/themes.ts` — elevation presets**
   - These all use box-shadow only, so they automatically pick up the new radius. No change needed, but verify `cartoon` (sticker offset) still looks right at `0.75rem` — if the offset shadow shows a square corner, switch its `5px 5px 0 0` to also be radius-aware (it is, since it's a `box-shadow`, so fine).

No component API changes. Purely CSS / spacing tweaks.
