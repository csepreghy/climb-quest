## Goal
Make the topographic background recede so it reads as ambience behind UI text, and add a subtle layered stone texture to the dark base — all pure canvas, no images.

## Changes to `src/components/TopographicBackground.tsx`

### 1. Calm the contours
- **Iso-levels:** drop from 16 → 8.
- **Line width:** 1.35px → 0.7px.
- **Opacity:** stroke alpha ~`0.22 * levelAlpha` (was `0.8`). Hue stays gold (`hsl(45 85% 55%)`), slightly desaturated.
- **Field range:** widen `levelMin/Max` to `0.28–0.78` so the remaining lines spread out instead of bunching.

### 2. Layered stone base (new render passes, before contours)
- **Pass A — fine grain:** per-pixel monochrome noise written into an `ImageData` buffer at a downsampled resolution (e.g. 1/2 scale), then drawn back stretched. Luminance jitter ±4 around the base `hsl(220 35% 3%)`. Cheap, runs once on render/resize.
- **Pass B — coarse mottling:** reuse the existing FBM field at low frequency, mapped to a very subtle lightness shift (±2%) drawn as a translucent fill grid. Gives the "weathered stone" blotchiness.
- **Pass C — cracks:** a second high-frequency FBM thresholded to a thin band (e.g. `abs(n - 0.5) < 0.012`), stroked as 1px dark hairlines at `hsl(220 30% 1% / 0.55)`. Sparse, irregular, no marching squares needed — just pixel hits drawn as 1px rects.
- **Vignette:** very faint dark radial overlay at the edges (`0 → 0.25` alpha) to anchor focus toward the center where UI sits.

### 3. Order of operations per `render()`
1. Solid black fill
2. Pass A (grain) → Pass B (mottle) → Pass C (cracks)
3. Gold contours (dim, fewer)
4. Vignette overlay

## Files touched
- `src/components/TopographicBackground.tsx` — only this file.

## Out of scope
- No `index.css` or `Layout.tsx` changes.
- No new assets, no fonts, no animation (still static).

## Risk / perf
- All passes are O(pixels) once per render/resize. Grain pass uses a downsampled `ImageData` to keep it fast on 4K displays. No rAF loop.
- If grain still feels too noisy, easy follow-up: lower its alpha or coarsen the downsample factor.
