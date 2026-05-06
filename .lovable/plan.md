## Goal

Move ClimbQuest off the warm brown/stone palette into a soft **pastel RPG-menu** look. All surfaces use **flat solid colors** (no gradient fills). Gradients are reserved for **shadows / bevels only** — i.e. the soft inner highlight + dark inner bottom shade that gives buttons and panels their dimensional, "cartoony game UI" feel.

## Palette direction

Dark, cool base with sugary pastel accents — think a candy-colored quest menu over a deep slate room.

- Background: deep slate-indigo (flat, very dark) — `hsl(230 22% 10%)`
- Card / panel fill: slightly lifted slate — `hsl(230 18% 14%)` (flat)
- Panel frame: near-black slate `hsl(230 30% 6%)`
- Panel inner edge: cool gray `hsl(230 12% 28%)`
- Text: soft off-white `hsl(220 25% 95%)`
- Muted text: `hsl(225 12% 65%)`

Pastel accent set (each one a single flat color, no gradient):
- Mint (primary action / XP): `hsl(155 55% 65%)`
- Peach (secondary highlight): `hsl(18 85% 72%)`
- Lavender (rare): `hsl(265 70% 78%)`
- Sky (info / level chip): `hsl(205 75% 70%)`
- Lemon (Chalk / legendary): `hsl(48 90% 70%)`
- Rose (boss / danger): `hsl(350 75% 72%)`

Each accent has a paired darker "shadow" tone used **only** in the chunky drop-shadow under buttons/panels (e.g. mint button → mint-700 hard shadow). That's where gradients live — as soft top-highlight + bottom-shade insets.

## What changes

### 1. `src/index.css`
- Replace all brown/stone HSL tokens (`--background`, `--card`, `--secondary`, `--border`, `--panel-*`, `--btn-*-top/bot`, `--chalk`, `--xp`, `--boss`, `--legendary`, `--rare`, `--accent`) with the pastel palette above.
- Remove the warm radial-gradient body wash. Body becomes a **flat** dark slate. Optional: a single very subtle vignette via `radial-gradient(... transparent ... darker)` — that's a shadow effect, not a color fill, so it stays.
- `--shadow-panel`: keep the multi-layer bevel (outer dark frame, inner light highlight, inner dark shade, ground shadow) but recolor stops to the cool slate family.
- `gradient-chalk-text`: switch to a flat lemon color (`color: hsl(var(--chalk))`) — drop the gradient text since rule is "no gradients except for shadows".

### 2. `src/components/ui/game-button.tsx`
- `bevel()` helper currently builds a `linear-gradient(180deg, top, bot)` background. Change to a **flat solid background** per variant (e.g. mint, peach, rose, lemon, slate).
- Keep the bevel shadow stack: top inset highlight + bottom inset shade + chunky `0 3px 0 hsl(shadow)` hard drop + soft ground shadow. Those stay (they're shadows).
- Adjust per-variant text color for AA contrast on each pastel.

### 3. `src/components/ui/game-card.tsx`
- `rpg-panel` fill becomes a **flat** `hsl(var(--card))` instead of the `linear-gradient(...)` it currently uses. Bevel comes entirely from `--shadow-panel`.
- Tone accent rail (top hairline + ring) recolored to pastel tones.

### 4. `src/components/Layout.tsx`
- Header logo tile, `Lv` chip, and active-nav pill: replace inline `linear-gradient` backgrounds with flat pastel fills (`hsl(var(--accent))` mint for active nav, slate for chips). Keep the inset-highlight + inset-shade box-shadows for the bevel.
- `ChalkChip`: coin badge currently uses a radial-gradient fill — recolor to a flat lemon disk with an inset bottom shadow ring for depth (shadow, not gradient fill).

### 5. `src/components/pixel/GameBackground.tsx`
- Strip the warm radial gradients. Either render nothing (flat body color is enough) or keep one ultra-subtle dark vignette overlay for framing. No colored fill gradients.

### 6. `src/components/pixel/LevelUpBanner.tsx`
- Banner border/glow recolored to lemon/peach pastel. Title uses flat `text-accent`.

## What does NOT change

- Layout, spacing, typography, animations.
- Game logic, routes, store, sprites, copy.
- Component APIs (`GameCard tone="boss"` etc. still work; only the colors behind those tones change).

## Verification

After approval I'll spot-check Dashboard, Shop, and Bosses to ensure: no brown remains, button/panel depth still reads as chunky-RPG, contrast on pastel buttons is legible, and no element uses a gradient as a color fill (only as bevel/shadow).
