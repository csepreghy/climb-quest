## Scope

This step adds **Climbing Buddy as its own first-class category** alongside Outfit / Gear / Power-ups, focused on what's visible right now: admin upload, shop display, and inventory display, with **larger, more prominent images** than other items. No perks or level multiplier yet — those land in a follow-up step.

---

## Data shape (`src/game/data.ts`)

- Extend `ItemGroup` → `"outfit" | "gear" | "power" | "buddy"`.
- Extend `Slot` → add `"buddy"`.
- Extend `ShopItem.category` → add `"Buddy"`.
- `effectAllowed`: buddies don't carry chalk/discount/crit/boss for now (return `false` for all four when group is `"buddy"`). Keeps the admin form clean and prevents accidental balance shifts.
- Export `BUDDY_SLOT_UNLOCK_LEVEL = 6` (unused this step but referenced by inventory locked state).

No DB migration needed — `shop_items.group/category/slot` are already free-form `text`.

---

## Admin panel (`src/pages/Admin.tsx`)

In the items admin form:

- Add `{ value: "buddy", label: "Climbing Buddies" }` to `GROUP_OPTIONS`.
- Add `buddy: ["Buddy"]` to `CATEGORIES_BY_GROUP`.
- Add `Buddy: "buddy"` to `CATEGORY_TO_SLOT`.
- When group is `buddy`, hide the chalk-bonus / discount / crit / boss inputs (they're already gated by `effectAllowed`, which now returns false for buddies).
- Item list renders buddies in their own group section, like the other groups, but with a larger thumbnail (96–112 px) so admins can review the art quality.

---

## Shop (`src/pages/Shop.tsx`)

- Add `{ key: "buddy", label: "Climbing Buddies", categories: [] }` to the `GROUPS` tab list. Place it as the **last tab** so it visually anchors the row.
- When `group === "buddy"` (or "all" + a buddy is rendered), render a **`BuddyCard`** variant of `ShopCard` instead of the standard card:
  - Card spans 2 columns on `sm+` (`sm:col-span-2`) so each buddy is large.
  - Image area is square, ~200–240 px, rendered above the text (vs. the inline 80 px thumbnail other items use).
  - Rarity ring uses `RARITY_BORDER` at a thicker ring for emphasis.
  - Same buy/own/lock/price footer as other items.
- "All" tab interleaves buddies but still renders them with the larger card.

---

## Inventory (`src/pages/Inventory.tsx`)

- `GROUP_LABEL.buddy = "Climbing Buddies"`.
- `GROUP_SLOTS.buddy = ["buddy"]`.
- `SLOT_LABEL.buddy = "Buddy"`.
- Add `"buddy"` to the `(["outfit","gear","power","buddy"])` lists in both the **Equipped** section and the **Owned** grouping. Place it **last** in equipped, **first** in owned (so the companion lane has a prominent home).
- Equipped Buddy lane shows a single slot: empty / locked (Lv 6) / equipped, using a **larger card** (full-width on `sm+`, ~200 px image).
- Owned Buddies render with the larger card variant (same as shop).
- A new `BuddyCard` component (next to `ItemCard`) handles the larger layout. `ItemCard` stays unchanged for the other categories.

Equip/unequip/buy logic already works generically off `slot` — no store changes needed.

---

## New component

`src/components/BuddyCard.tsx` — variant of `ItemCard` with:

- Large square image on top (uses `SmartImage` with bigger `loaderSize`).
- Name + rarity chip below.
- Optional description.
- Optional action button (Equip / Unequip) and admin remove button, mirroring `ItemCard` props so callers swap with minimal change.

Shop uses the same component for its buddy cards (with price footer overlaid, same pattern as `ShopCard`).

---

## Out of scope (next step)

- Per-level chalk multiplier.
- Buddy perks (Beta share, Spotter, Hype, Endurance coach).
- Buddy slot unlock gating in the store/equip flow beyond UI display.
- Admin per-perk inputs and rebalance integration.

---

## Files affected

- `src/game/data.ts` — extend `ItemGroup`, `Slot`, `ShopItem.category`, `effectAllowed`, add `BUDDY_SLOT_UNLOCK_LEVEL`.
- `src/pages/Admin.tsx` — add buddy to group/category/slot maps; hide irrelevant inputs for buddies; larger thumbnail in admin item list.
- `src/pages/Shop.tsx` — new "Climbing Buddies" tab; render buddies via larger card.
- `src/pages/Inventory.tsx` — add buddy lane (equipped + owned) with larger card.
- `src/components/BuddyCard.tsx` — new larger-image card component.
