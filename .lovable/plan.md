A public ClimbQuest landing at `/` with a looping feature showcase that **renders the real in-app components** (same `GameCard`, `PickCard`, `ItemCard`, `ClimberAvatar`, `LevelPreviewCard`, `PixelBar`, etc.) so the preview is pixel-identical to the actual product.

## Routing
- `/` → public `Landing` (no auth).
- Move dashboard to `/home` (still in `RequireAuth` + `Layout`).
- Signed-in users hitting `/` redirect to `/home`.
- `Layout` logo + Home nav point to `/home`.

## Page structure (`src/pages/Landing.tsx`)

1. **Top bar** — `climbquest-logo.png`, "Sign in" ghost button, "Start climbing" `GameButton` → `/auth`. Same pultruded style as the app header (border + inset shadow).

2. **Hero** — two columns:
   - Left: orange "New" chip ("Log boulders. Earn Chalk. Send bosses."), big headline ("Turn every session into XP."), subhead, two CTAs (`GameButton` primary + ghost).
   - Right: the **looping showcase card**.

3. **How it works** — 3 cards reusing the exact `PickCard` style from `LogModal` (pultruded `border-2 border-[hsl(var(--panel-frame))] bg-secondary/50` + inset shadows + `aspect-square` image area): Log, Earn Chalk, Level up.

4. **Final CTA** — large `GameCard tone="accent"` with headline + primary `GameButton`.

5. **Footer** — small © line.

## Looping showcase

A single pultruded `GameCard` (same frame as the app's hero card) with fixed aspect ratio, auto-advancing every ~3.5s, dot indicators, pause on hover, `animate-fade-in` per slide.

Each slide reuses **real components** from the app:

1. **Characters** — `ClimberAvatar size="xl" glow` cycling L1/L4/L7/L10 (alternating gender), with the resolved level title + tagline below (from `LEVELS` + `useLevelOverrides`).
2. **Items** — 2×3 grid of `ItemCard`-styled tiles for a hand-picked set of `BUILTIN_ITEMS` (mix of rarities), reusing `RARITY_BORDER`, `SmartImage`, and the same rarity ribbon used in `Inventory.tsx`. Extract `ItemCard` from `Inventory.tsx` into `src/components/ItemCard.tsx` so both pages can import it.
3. **Log a climb** — render the actual `PickCard` pair (Boulder + Boss) used in `LogModal`. Extract `PickCard` from `LogModal.tsx` into `src/components/pixel/PickCard.tsx` and import in both. Caption: "Log every session in seconds."
4. **Boss projects** — pultruded card showing `log-boss.webp` + a `PixelBar` filling 0→80% with a "Crux Cave · 12 attempts" line. Same style as boss section on Dashboard.
5. **Level up** — the new `LevelPreviewCard` twin (current → next) from `Layout.tsx`. Extract it into `src/components/LevelPreviewCard.tsx` and import in both. Includes chalk-fly particles.

Mechanics: `useState` index + `useEffect` interval (cleared on hover/unmount), dot row jumps to slide on click, container has fixed `aspect-[4/5]` on mobile / `aspect-square` on desktop so layout doesn't shift.

## Background
Soft radial gradient + 2-3 blurred orange/green orbs (CSS only, `pointer-events-none`) behind content. Uses existing tokens; no new colors or deps.

## Refactors (so showcase mirrors the app exactly)
- Extract `PickCard` from `LogModal.tsx` → `src/components/pixel/PickCard.tsx`; update `LogModal` to import it.
- Extract `ItemCard` from `Inventory.tsx` → `src/components/ItemCard.tsx`; update `Inventory` to import it.
- Extract `LevelPreviewCard` from `Layout.tsx` → `src/components/LevelPreviewCard.tsx`; update `Layout` to import it.

## Files
- Add: `src/pages/Landing.tsx`
- Add: `src/components/pixel/PickCard.tsx`, `src/components/ItemCard.tsx`, `src/components/LevelPreviewCard.tsx`
- Edit: `src/App.tsx` (public `/`, dashboard at `/home`, redirect)
- Edit: `src/components/Layout.tsx` (logo/Home → `/home`, import extracted LevelPreviewCard)
- Edit: `src/components/LogModal.tsx`, `src/pages/Inventory.tsx` (use extracted components)

No backend or schema changes. No new dependencies.
