# Flatten Power-ups + add two new economy mechanics

## Part 1 — Power-ups: one flat slot

- In `src/game/data.ts`, add `Slot = "powerup"` and remove `aura` / `title` from the practical UX (keep the type values for back-compat reads, but admin form no longer offers them).
- `CATEGORIES_BY_GROUP.power` becomes a single placeholder; admin form **hides the Category dropdown** entirely when `group === "power"` and forces `slot = "powerup"`.
- `CATEGORY_TO_SLOT` updated: any power-group item → `"powerup"`.
- `Shop.tsx`: remove the Accessories/Auras/Titles/Consumables tab list — Power-ups becomes a single flat list (still split visually into "Equippable" vs "Consumables" since consumables behave differently).
- `Inventory.tsx`: collapse `power` group into one section labelled "Power-ups". Drop the per-slot subheaders for `aura` / `title`.
- One-time **back-fill migration** in `customItems.ts` startup (or a one-off SQL data update via the insert tool): every existing item with `group='power'` gets `slot='powerup'` and `category='Power-up'`. Auras & titles already equipped on users keep working because the equip lookup still resolves by item id.

## Part 2 — Two new economy mechanics

Add to `ShopItem` (and `shop_items` table):

1. **`critChancePct`** — % chance that a single log's total Chalk is doubled. Roll once per log inside `computeChalk`, after all bonuses. Add a "Crit! ×2" line to the breakdown when it fires. Stack across equipped items by taking `1 - Π(1 - p_i)`.
2. **`bossBonusPct`** — extra % Chalk on `boss_attempt` and `boss_send` activities. Implemented as a normal equipped bonus, but stored as a dedicated column so rebalance can tune it independently from generic chalk bonus.

DB migration adds two nullable numeric columns: `crit_chance_pct`, `boss_bonus_pct` (default 0). `customItems.ts` reads/writes them. Admin form gets two new number inputs.

## Part 3 — Rebalance auto-tunes everything

Extend `src/game/rebalance.ts`:

- `targetCritPct(item)`: only epic/legendary; epic = 5, legendary = 12. Other rarities = 0.
- `targetBossBonusPct(item)`: only epic/legendary; epic = 8, legendary = 20. Other rarities = 0.
- Slot adjustments so a single item doesn't get every effect at full strength:
  - **`powerup` slot** → leans into crit + boss bonus (full values), dampened generic bonus & discount (×0.5).
  - **`study` slot** → keeps current (discount-heavy, half bonus, no crit/boss).
  - All other slots → small share of crit/boss for epic/legendary (×0.5).
- `targetPrice` value-mult formula updated to include the new effects, weighted similarly: `1 + (bonusPct + discountPct + critPct*1.5 + bossBonusPct) * 0.005`. Crit weighted ×1.5 because doubling all chalk is roughly twice as juicy as +1% bonus.

Preview modal gains two extra columns ("Crit %", "Boss %") in the items table.

## Out of scope

- Migrating already-equipped `aura` / `title` items in saved game state (they keep working; just no longer discoverable as separate slots in the UI).
- Boss high-point boost, streak bonus, level-up cost discount (rejected this round).
- Per-style or per-activity tuning of crit / boss bonus.

## Files

- **Edited**: `src/game/data.ts`, `src/game/customItems.ts`, `src/game/store.ts` (computeChalk crit roll, breakdown), `src/game/rebalance.ts`, `src/components/RebalancePreviewModal.tsx`, `src/pages/Admin.tsx` (form fields + hide Category for power), `src/pages/Shop.tsx`, `src/pages/Inventory.tsx`, `src/components/ItemCard.tsx` (show crit / boss badges).
- **Migration**: add `crit_chance_pct`, `boss_bonus_pct` columns to `shop_items`; data update to set `slot='powerup'`, `category='Power-up'` on existing power items.
