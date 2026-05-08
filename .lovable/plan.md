# Rebalance economy (admin tool)

The previous plan was approved but the code was never written — that's why no button appears on `/admin`. Here is the plan to implement now.

## UI

Add a new `GameCard` to `src/pages/Admin.tsx` (above `InventoryAdmin`) titled **"Admin · Rebalance economy"** with a single **"Preview rebalance"** button.

Clicking it opens a `Dialog` (`src/components/RebalancePreviewModal.tsx`) containing:

1. **Shop items table** — every item with `Now` vs `New` columns for `price`, `bonus %`, `discount %`. Changed cells highlighted, unchanged dimmed.
2. **Activity rewards table** — the 6 `BASE_CHALK` activities with current vs proposed values, gated by a checkbox at the top: **"Also rebalance activity rewards"** (default off). When unchecked, activity rows are dimmed and skipped on apply.

Footer: live count of items + activities that will change, **Cancel** and **Apply rebalance** buttons.

## Rebalance formula (`src/game/rebalance.ts`)

- **Price**: `rarityBase = { common: 80, rare: 700, epic: 7000, legendary: 100000 }`, scaled by `~+18%` per level over 1, slot weight (`shoes 1.1`, `study 1.2`, etc.), rounded nicely.
- **Chalk bonus %**: `rarityBonus = { common: 2, rare: 6, epic: 15, legendary: 35 }`, with slot adjustments (`aura +5`, `study 0`).
- **Discount %**: only Study items (rare 5, epic 15, legendary 30).
- **Activity rewards**: `warmup_boulder 20`, `boulder 60`, `hard_boulder 140`, `boulder_send 45`, `boss_attempt 55`, `boss_send 350`.

Pure function `proposeRebalance()` returns `{ items: ItemDiff[], activities: ActivityDiff[] }`.

## Apply

- Calls `updateCustomItem` for each shop item with a diff.
- If checkbox is on, writes new `BASE_CHALK` values to a new `activity_rewards` table (admin-only RLS, mirrors `level_overrides`) and reloads into memory via `src/game/activityRewards.ts`.
- Toast: `Rebalanced N items + activity rewards`.

## Files

- **New**: `src/game/rebalance.ts`, `src/components/RebalancePreviewModal.tsx`, `src/game/activityRewards.ts`.
- **Edited**: `src/pages/Admin.tsx` (add `RebalanceCard`), `src/game/store.ts` (read `getActivityRewards()` instead of `BASE_CHALK` directly), `src/game/data.ts` (keep `BASE_CHALK` as defaults, export `ActivityRewards` alias).
- **Migration**: new `activity_rewards` table with admin-only RLS.

## Out of scope

Per-item manual editing in preview, undo/history, level chalk costs, boss reward multipliers, `appliesTo` / `styleMatch` / `levelReq` adjustments.
