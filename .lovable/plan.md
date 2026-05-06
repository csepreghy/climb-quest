## Goal

Make ClimbQuest feel like a real bouldering RPG by adding pixel-art and cartoon visuals built from pure SVG + CSS — no external image assets required. Keep the polished dark UI, but layer in chunky game-feel elements.

## Visual Direction

Pick **"Chunky Pixel RPG"** as the dominant style:

- 8/16-bit pixel-art sprites for climbers, bosses, and items, drawn as SVG with hard edges (`shape-rendering: crispEdges`)
- Cartoon sticker-style cards: thick borders, drop shadows, slight tilt on hover, little "pop" wobble on click
- Animated background: parallax pixel-art climbing wall (rocks, holds, chalk dust particles) behind the dashboard
- Dithered gradients (CSS) instead of smooth ones — gives a retro game-screen feel
- Pixel-style display font for headings (e.g. "Press Start 2P" or "VT323" via Google Fonts) paired with current Inter for body
- Chunky game-style buttons with offset bottom shadow that "presses" down on click

## What I'll Build

1. **Pixel-art sprite system (SVG)**
   - `PixelSprite` component renders a sprite from a small grid string (e.g. `". . X X . . / . X 1 1 X ."`) with a color palette per sprite
   - Sprite library: 10 climber avatars (one per level), 6 bosses, key items (chalk bag, shoes, brush, crocs, magdust)
   - Each sprite has an idle bobbing animation and optional aura layer
   - Climber sprites adapt clothing color by gender variant

2. **Animated game background**
   - Fixed-position pixel-art climbing wall with bouldering holds scattered across it
   - Slow drifting chalk dust particles (CSS keyframes)
   - Subtle parallax on scroll

3. **Cartoon card system**
   - New `GameCard` variant: thick 3px border, hard offset shadow (`box-shadow: 6px 6px 0 hsl(...)`), slight rotate on hover
   - Loot cards get a rarity-colored holographic shimmer for legendary items
   - Boss cards get a "health bar" styled like a classic RPG (segmented, glowing)

4. **Chunky game buttons**
   - Pressed-button effect: offset shadow that collapses on `:active`
   - Sparkle/pop animation when clicked (CSS-only, small SVG burst)
   - Primary CTAs ("Log Boulder", "Attempt Boss", "Level Up") get the full treatment

5. **HUD / status flourishes**
   - Chalk counter becomes a pixel chalk-bag icon with a bouncing number
   - Level chip becomes a pixel badge with a sparkle ring
   - Progress bars get segmented "XP bar" styling with scanlines
   - Toasts get a pixel-art frame

6. **Floating reward animation**
   - When chalk is earned, "+126 CHALK" floats up from the button in pixel font with a small particle burst
   - Level-up triggers a fullscreen pixel banner ("LEVEL UP!") with confetti

7. **Boss & item art**
   - Each boss gets a unique pixel sprite (slab menace = stoic stone face, board goblin = green crouching gremlin, etc.)
   - Shop items get pixel icons replacing emoji (still keep emoji as fallback)

## Technical Details

- New file `src/components/pixel/PixelSprite.tsx`: SVG sprite renderer from string grid + palette
- New file `src/components/pixel/sprites.ts`: sprite definitions (climbers, bosses, items)
- New file `src/components/pixel/GameBackground.tsx`: fixed pixel wall + chalk dust
- New file `src/components/pixel/RewardPop.tsx`: floating "+chalk" animation
- New file `src/components/ui/game-card.tsx` and `game-button.tsx`: cartoon variants
- Extend `src/index.css` with: pixel-perfect rendering helpers, dither gradient utilities, chunky shadow tokens, scanline overlay, sparkle keyframes, level-up banner keyframes
- Extend `tailwind.config.ts` with `font-pixel` family + new shadows
- Add Google Fonts link in `index.html` for "Press Start 2P" (titles only) and "VT323" (numbers/HUD)
- Update `Layout`, `Dashboard`, `Bosses`, `Shop`, `Inventory`, `Character`, `LogBoulder` to use new sprite + card + button components
- `ClimberAvatar` swaps emoji for `PixelSprite` (keeps same API)

No asset files, no backend, no new dependencies — everything is SVG + CSS + Google Fonts.

## What Stays The Same

- Dark near-black palette, chalk-white text, semantic color tokens
- All game logic, localStorage persistence, routing, RPG mechanics
- Responsive layout for desktop + mobile