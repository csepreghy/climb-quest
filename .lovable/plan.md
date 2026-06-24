## Goal
Add a **Card Lab** admin tab where you mix-and-match card surface treatments live — color, rocky texture intensity, 3D effect style, edge treatment, and bottom-border style — preview them on sample cards, and optionally apply globally to the whole app for browsing-around evaluation.

## New tab: `Card Lab`

Added as a 10th tab in `src/pages/Admin.tsx` (`value="card-lab"`, icon `Sparkles`), rendered from a new `src/components/admin/CardLab.tsx`.

### Layout
Two-column on desktop, stacked on mobile:
- **Left — Controls panel** (sticky)
- **Right — Live preview** (3 sample GameCards over the topographic background)

A top bar holds: preset dropdown, "Apply globally" toggle, "Reset", "Copy CSS" button.

### Controls (all wired to CSS variables)

**Fill color**
- Hue slider (0–360, default 220)
- Saturation (0–60, default 28)
- Lightness (1–14, default 5)
- Result drives `--lab-card-fill`

**Rocky texture**
- Intensity slider 0–100% → opacity of an SVG `feTurbulence` noise layer composited over the card via `::after`
- Coarseness slider (baseFrequency 0.4–1.4)
- Tint toggle: dark vs. gold-tinted grain
- Result drives `--lab-tex-opacity`, `--lab-tex-freq`, `--lab-tex-tint`

**3D effect**
Radio between 5 recipes, each maps to a different `--lab-shadow` value:
1. Flat (1px outer line only)
2. Inset well (current recipe)
3. Raised plate (chunky RPG bevel — the old shadow)
4. Floating lithograph (deep ambient drop)
5. Carved relief (top-light inner shadow + bottom-light highlight)

**Edge treatment**
Radio:
1. None
2. Gold hairline top (gradient `::before`)
3. Gold hairline all sides (inset 1px ring)
4. Chiseled bevel (white top + black bottom 1px)

**Bottom border**
Radio:
1. None
2. Dark thick (`4px solid hsl(220 50% 2%)`)
3. Gold solid (`3px solid hsl(45 85% 55%)`)
4. Gold gradient fade (linear-gradient mask, 3px)

**Border radius** slider (0–20px)

### Presets
A dropdown with 4 starting points so you don't always start from zero:
- "Current production"
- "Bronze plaque" (raised + gold full hairline + gold bottom)
- "Carved stone" (inset well + heavy rocky tex + dark bottom)
- "Lithograph" (flat + gold top hairline + deep drop)

Selecting a preset just sets all the sliders/radios. You can then tweak.

### Apply globally toggle
- **Off** (default): the CSS variables and `::after` texture are scoped to a `.cq-card-lab-preview` wrapper, so only the preview cards change.
- **On**: the same variables are injected into `:root` via a `<style>` tag in `document.head`, and a global `.rpg-panel` override rule consumes them — every card in the app reflects the choice while you browse around.

State persists to `localStorage` under `cq.cardLab.v1` so refreshes keep your tweaks. Global mode also rehydrates on app boot via a tiny init in `Layout.tsx` (reads the same key and re-injects the style tag).

### Copy CSS button
Outputs the resolved `.rpg-panel { … }` rule + `::before/::after` so I can later paste the chosen recipe into `src/index.css` permanently.

## Files
**New**
- `src/components/admin/CardLab.tsx` — full UI, state, style injection
- `src/components/admin/cardLabPresets.ts` — preset recipes + the variable→CSS mapping logic

**Edited**
- `src/pages/Admin.tsx` — add tab + content
- `src/components/Layout.tsx` — 5-line `useEffect` on mount that rehydrates global Card Lab styles from localStorage

## Out of scope
- No changes to `index.css` defaults yet — Card Lab is a playground. Once you pick a winner, easy follow-up: I paste the resolved recipe into `--shadow-panel` / `.rpg-panel` and remove the global-apply mode.
- Header, bottom nav, buttons, tiles — untouched.
- No backend persistence (admin-only local tool).

## Risk
- Global-apply mode injects a `<style>` tag that overrides `.rpg-panel`. If a card somewhere relies on a very specific shadow override, it'll be visually affected while the toggle is on. Toggling off restores everything instantly.
- Rocky texture uses an inline SVG data-URI per card (cached by the browser). No perf concern at the densities we expect.
