## Badge Redesign Plan

### Overview
Completely revamp the badge system: remove all 18 existing badges except Shopaholic, switch from emoji-based to image-based badges, render every badge as a circular card with shine/3D effects, and prepare for user-provided 150×150 artwork.

---

### Phase 1 — Badge Data Refactor

**`src/game/data.ts`**
- Update `BadgeDef` interface: replace `emoji: string` with `image: string` (path or asset URL) and add optional `rarity: Rarity`.
- Replace the `BADGES` array so it contains only the Shopaholic badge:
  ```ts
  { id: "shopaholic", name: "Shopaholic", image: "", desc: "Bought 10 shop items.", rarity: "epic" }
  ```
- Update `BADGE_BY_ID` accordingly.

**`src/game/store.ts`**
- No schema changes needed (`badges: string[]` stays).
- Keep badge award/grant logic intact; it already works with string IDs.
- Update any hard-coded badge references (e.g., in onboarding or level-up unlocks) to remove deleted badges.

### Phase 2 — UI Components

**New: `src/components/BadgeCard.tsx`**
- Circular badge display component.
- Two style options (user can pick or we can support both):
  1. **Shine variant**: Circular container with animated rarity glow (`animate-rarity-glow`), subtle gradient overlay, and a glint/shine effect similar to shop item hover previews.
  2. **Token variant**: Flat circular token with a bottom 3D perspective shadow, like a circular trading card/token.
- Props: `image`, `name`, `desc`, `have` (unlocked or locked), `rarity`, `onClick`.
- Locked state: grayscale/dimmed with a lock icon or question mark overlay.
- Size: default 64×64px image area inside a ~80×80px circular frame for grids; larger 120×120px for the unlock banner.

**Update: `src/pages/Dashboard.tsx` — `BadgesGrid`**
- Replace the emoji + text-row layout with a grid of `BadgeCard` components.
- Each cell shows the circular badge image, name below, and description on hover or in a detail modal.
- Keep the expand/collapse behavior.
- Update the modal that opens on badge click to show the larger circular badge image.

**Update: `src/components/pixel/BadgeUnlockBanner.tsx`**
- Replace the large emoji display with a large circular `BadgeCard` (120px) in the center of the banner.
- Keep the chalk reward and particle burst animations.

### Phase 3 — Asset Pipeline

**`src/assets/` & Lovable Assets**
- Create a dedicated badge asset folder pattern: `src/assets/badges/<badge-id>.asset.json`.
- Document the image spec for the user:
  - Resolution: 150×150px (square source, rendered circular via CSS `border-radius: 50%` and `object-fit: cover`)
  - Format: PNG or WebP with transparent background preferred
  - File naming: `<badge-id>.png` (e.g., `shopaholic.png`)
- When the user uploads badge images, use `lovable-assets create --file <path> --filename <badge-id>.png > src/assets/badges/<badge-id>.png.asset.json` and remove the local binary.
- Update `src/game/data.ts` badge definitions to point to the imported asset URLs.

### Phase 4 — Cleanup

- Search the codebase for any remaining references to the deleted badge IDs and remove/update them.
- Update `src/index.css` if any badge-specific utility classes are needed (e.g., `.badge-glow`, `.badge-token-shadow`).
- Verify no TypeScript errors and that the build passes.

### Out of Scope (Next Iteration)
- The user will provide the new full badge list and images in a follow-up request.
- For now, only Shopaholic exists in the data; the UI must be robust enough to render an arbitrary number of badge images when they arrive.

---

### Acceptance Criteria
1. Only the Shopaholic badge appears in the badge grid.
2. All badge slots render as circular images, not emojis.
3. Locked badges show a circular placeholder (question mark or lock) with dimmed styling.
4. Badge unlock banner shows a large circular badge image instead of an emoji.
5. Build passes with zero TypeScript errors.
6. Asset pipeline is ready for 150×150 user-provided images.