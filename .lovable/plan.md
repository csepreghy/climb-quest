## Goal
Re-tune the header, bottom nav, and container cards so they sit naturally on the cool dark stone background — cooler hue, faint gold accents, more translucency, and cards that feel carved *into* the surface rather than floating above it.

## Token changes — `src/index.css`

### Re-color the chrome (warm 20° → cool 220°)
- `--background`: `20 14% 12%` → `220 25% 6%`
- `--card`: `20 18% 10%` → `220 28% 5%`
- `--popover`: same as card
- `--secondary` / `--muted`: `20 14% 16%` → `220 18% 10%`
- `--input`: `20 18% 12%` → `220 22% 8%`
- `--border`: `20 30% 6%` → `220 35% 3%`
- `--panel-frame`: `20 40% 4%` → `220 50% 2%`
- `--panel-edge`: `20 20% 22%` → `220 18% 18%`
- `--panel-fill`: `20 18% 10%` → `220 25% 6%`
- `--panel-inset-light`: tint shifted to `220 25% 90%` (still mostly luminance)
- `--panel-inset-dark`: `220 60% 1% / 0.9`

Primary/accent/legendary gold tokens **untouched** — gameplay color identity stays.

### New gold trim token
- Add `--gold-trim: 45 85% 55%;` (matches the contour hue).

## Card style — `.rpg-panel` becomes an inset well

Replace `--shadow-panel` so cards read as recessed rather than raised:

```css
--shadow-panel:
  inset 0 0 0 1px hsl(var(--gold-trim) / 0.18),     /* hairline gold edge */
  inset 0 2px 6px hsl(220 60% 1% / 0.7),            /* deep top shadow */
  inset 0 -1px 0 hsl(var(--gold-trim) / 0.06),      /* faint bottom glint */
  0 0 0 1px hsl(220 50% 2%),                        /* crisp outer line */
  0 1px 0 hsl(220 20% 12% / 0.5);                   /* subtle outer highlight */
```

`.rpg-panel` background drops slightly *below* the page bg (`hsl(220 30% 4%)`) so the well reads as carved into the stone. Keep rivets but recolor to `hsl(220 14% 30%)`.

`tile-3d` (inventory tiles) gets the same hue shift but **keeps its raised bevel** — those are loot icons, they should pop. Only colors change.

## Header — `src/components/Layout.tsx`

Current header:
```
background: hsl(var(--topbar-color, 210 25% 8%) / var(--topbar-opacity, 0.88))
```

Change to:
- Default `--topbar-color` fallback → `220 30% 4%`
- Default `--topbar-opacity` fallback → `0.55`
- Bump `backdrop-blur-xl` → `backdrop-blur-2xl` for stronger blur
- Replace bottom border with a 1px gold hairline: `border-b border-[hsl(var(--gold-trim)/0.25)]`
- Shadow becomes a soft dark drop: `shadow-[0_8px_24px_-12px_hsl(0_0%_0%/0.8)]`

## Bottom nav — `src/components/Layout.tsx`

Currently `bg-background/90 backdrop-blur-xl border-t border-border`. Change to:
- `bg-[hsl(220_30%_4%/0.55)] backdrop-blur-2xl`
- `border-t border-[hsl(var(--gold-trim)/0.25)]`
- Add subtle inner top highlight: `shadow-[inset_0_1px_0_hsl(var(--gold-trim)/0.08),0_-8px_24px_-12px_hsl(0_0%_0%/0.8)]`

## Files touched
- `src/index.css` — token recolors, gold-trim token, panel shadow rewrite
- `src/components/Layout.tsx` — header + bottom nav classes

## Out of scope
- Topographic background component — unchanged
- Game color tokens (chalk, xp, boss, legendary, etc.) — unchanged
- Page-level layouts, inventory tile bevel — unchanged
- Light mode — project is dark-only

## Risk
- Many surfaces inherit from `--background`/`--card`/`--muted`; the hue shift will propagate site-wide. That's the intent, but a quick visual sweep of Inventory / Dashboard / Hangboard after the change is worth doing.
- If the inset-well shadow feels too subtle on small cards, easy follow-up: increase the inset top-shadow blur to 8–10px.
