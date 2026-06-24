## Goal

Replace the body gradient background for logged-in users with a CSS+Canvas topographic contour effect — near-black backdrop with thin gold contour lines, denser in two opposite corners and faint through the middle (matching the reference). Static render (no animation).

## Implementation

### 1. New component: `src/components/TopographicBackground.tsx`
- `<canvas>` fixed at `inset-0 -z-10 pointer-events-none`, sized to `window.innerWidth × innerHeight × devicePixelRatio`.
- Generates a smooth 2D scalar field via value-noise (hashed lattice + smoothstep + 4 octaves of FBM) — pure JS, no images, no libs.
- Adds a radial gradient bias so the field peaks in the top-right and bottom-left, troughs in the middle — produces the corner-cluster look from the reference.
- Draws contour lines by sampling the field on a grid and using marching-squares to emit line segments at ~14 iso-levels.
- Stroke = gold `hsl(42 85% 55%)`, line width 0.75–1px, alpha modulated by local field gradient (lines look brighter where contours bunch, faint elsewhere) and by the corner-bias mask.
- Background fill: dark base `hsl(220 18% 5%)` with a subtle radial vignette to a slightly bluer black, drawn before the contours.
- Re-renders on `resize` (debounced). No `requestAnimationFrame` loop.
- Accepts an `animated?: boolean` prop wired but defaulting to `false`; when true it would advance a `z` offset on rAF. Leaving the hook in place makes the later toggle a one-line flip.

### 2. Mount in `src/components/Layout.tsx`
- Render `<TopographicBackground />` as the first child of the root `<div>` so it sits behind `header`/`main`/`nav` (which already have their own backgrounds or transparency).
- Add a class on that root (e.g. `cq-app-shell`) used by CSS below.

### 3. `src/index.css`
- Add a rule: `body:has(.cq-app-shell) { background: hsl(220 18% 5%); }` to neutralize the body gradient on logged-in routes. Landing page is unaffected (it sets its own background on a wrapper and doesn't render `Layout`).
- No changes to the gradient default for logged-out shells.

## Technical notes
- Marching-squares with ~6px cell size at 1× DPR (~3px at 2× DPR) gives clean smooth contours without choppy stair-stepping.
- Total render cost: one-time, ~50–120 ms on a typical laptop at 1920×1080 — acceptable for a static background.
- Switching to animated mode later = set `animated` prop to `true`; the component already contains the rAF + z-offset code paths, gated by the prop.

## Files
- create `src/components/TopographicBackground.tsx`
- edit `src/components/Layout.tsx` (mount component + wrapper class)
- edit `src/index.css` (neutralize body gradient when shell is present)