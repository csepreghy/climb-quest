# Densify Inventory & Shop (revised)

Two different density levels, plus a strict no-overflow/no-overlap pass.

## Inventory — super compact (no name)

A new tile variant used only in the Inventory "Owned" section:

- Square thumbnail tile (`aspect-square`), padding `p-1.5`, rarity ring on the tile itself (existing `RARITY_BORDER`).
- **No name, no description, no rarity pill** — identity comes from the image + rarity ring color.
- Bonus badges (chalk%, crit, boss, discount) shown as small chips in the **top-right corner of the tile**, stacked vertically, max-width clamped, `whitespace-nowrap`, `text-[9px]`. They sit inside the tile padding so they never overlap a title (there is no title).
- Tap/click opens the existing compare/equip modal (unchanged behavior), so the name + details remain one tap away.
- A tiny "Equipped" check overlay (bottom-right) when already equipped; sell/remove stays in the modal — no per-tile action buttons (removes the biggest source of overflow today).
- Grid: `grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2`.
- Buddies in Owned: same tile treatment but `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` (bigger so the buddy art still reads).
- Equipped section stays exactly as it is today.

Implementation: add a new lightweight `InventoryTile` component (it does not need to share code with `ItemCard`), used only in the Owned section of `src/pages/Inventory.tsx`.

## Shop — slightly more compact

Keep names, descriptions, and the Buy button — just tighten and fix overlap:

- `ShopCard` padding `p-4` → `p-3`, internal gaps `gap-3` → `gap-2`.
- Thumbnail `h-20 w-20` → `h-16 w-16`; emoji font `text-5xl` → `text-4xl`.
- Description clamped to **2 lines** (`line-clamp-2`) to keep heights even.
- **Overlap fix**: badges currently sit absolutely in the top-right and we manually pad the title row with `pr-[92px]`, which fails when there are multiple badges or long names. Replace with a real layout: a header row that is `flex items-start justify-between gap-2`, with the title block on the left (`min-w-0` + `truncate` on the name) and the badge stack on the right (no absolute positioning, `shrink-0`, `flex-col items-end gap-0.5`). This guarantees badges never cover the title.
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3` (one extra column at `xl`).
- `BuddyShopCard` stays as-is (image-forward sales card), but apply the same header-row fix anywhere a `+xx%` chip is overlaid.

## Strict no-overflow / no-overlap pass

Applied to `ItemCard`, `BuddyCard`, `ShopCard`, `BuddyShopCard`, and the new `InventoryTile`:

- Every text node that can grow gets `truncate` or `line-clamp-N` and lives inside a `min-w-0` flex child.
- Every badge container uses `whitespace-nowrap` and `max-w-full`; the badge stack uses `shrink-0`.
- Replace remaining absolute-positioned badge overlays that cross other content (title row, action row) with flex siblings. Absolute is fine only when it overlays the **image tile**, where there is no text underneath.
- `GameCard` wrappers get `overflow-hidden` so shimmer/legendary effects can't bleed past the rounded border.

## Files touched

- `src/components/ItemCard.tsx` — header-layout fix (remove `pr-[92px]` hack, move badges into flex header), `line-clamp-2` on description, `overflow-hidden` on card.
- `src/components/BuddyCard.tsx` — same header-layout fix for the `+xx%` chip and any other overlays.
- `src/pages/Shop.tsx` — `ShopCard` slight compaction + header-layout fix; grid columns updated; `BuddyShopCard` overlay fix.
- `src/pages/Inventory.tsx` — Owned section switches to a new `InventoryTile` grid; Equipped section unchanged.
- `src/components/InventoryTile.tsx` — new, super-compact tile (image + rarity ring + corner badges + optional equipped check), opens existing modal on click.

Out of scope: backend/game logic changes, search/filter UI, virtualized lists, a Compact/Comfortable user toggle (can revisit if you want it later).
