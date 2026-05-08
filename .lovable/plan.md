# Surface special bonuses & make rebalance equip-cap aware

## Part 1 — Show new special bonuses in Inventory

Currently the Inventory's "Active bonuses" panel only lists generic `bonus.mult` rows. Crit chance, Boss bonus, and Shop discount are invisible to the player even when equipped. Item cards also only show the generic "+X%" badge.

### A) Active bonuses panel (left sidebar)
Extend `gearBonusSummary` (and the renderer) to also emit, when non-zero:
- **Shop discount** — best (lowest) `priceMult` across equipped items: `"Shop discount — −X%"`. (Logic mirrors `effectivePrice`: not stacked.)
- **Crit chance** — combined probability across equipped items via `1 − Π(1 − p_i)`, rendered as `"Crit chance — X% to ×2"`.
- **Boss bonus** — sum of `bossBonusPct` across equipped items, rendered as `"Boss attempts/sends — +X%"`.

Group visually under a small subheader so they read distinctly from the generic chalk multipliers (e.g. "Special" vs current "Activity bonuses").

### B) ItemCard badges
Augment the top-right pill so an item with multiple effects shows a small stack of badges instead of just `+bonus%`:
- `+B%` chalk (existing, kept)
- `−D%` shop (when `priceMult < 1`)
- `C% crit` (when `critChancePct > 0`)
- `+X% boss` (when `bossBonusPct > 0`)

Use existing chalk-glow tone for chalk/crit, a distinct token for discount (muted/secondary), and a distinct token for boss (e.g. destructive-tinted). All semantic tokens, no raw colors.

### Files
- `src/pages/Inventory.tsx` — extend `gearBonusSummary` return shape + render block.
- `src/components/ItemCard.tsx` — render the small badge stack.

## Part 2 — Make rebalance aware of the equip cap

You're right: rebalance currently sizes each item as if it's the only one equipped. The real ceiling matters.

### Equip cap (today)
- Outfit slots: **5** fixed (`outfit, bottoms, shoes, hat, hand`).
- Gear slots: **1 → 4** by level (`chalk, accessory, study`, capped at 4).
- Power-up slot: **1** (`powerup`).
- → Endgame max simultaneously equipped = **10 items** (5 outfit + 4 gear + 1 powerup).

### Target endgame ceilings (design budgets)
Used to size per-item magnitudes so a fully-decked legendary loadout stays within budget.

| Effect | Endgame ceiling (all-legendary loadout) | Notes |
|---|---|---|
| Generic chalk bonus (multiplicative stack) | ~+150% effective | currently uncapped; legendary 35% × 10 stacks → +2,000%+ |
| Shop discount | −30% | already non-stacking (best wins) — keep as is |
| Crit chance (combined) | 35% | using `1 − Π(1 − p)` |
| Boss bonus (additive) | +60% | sum across items |

### How rebalance enforces it
Add per-slot-class "share" weights and a global cap pass:

1. **Per-slot share weights** — how much of the budget a slot can contribute when fully legendary. Outfit slots are mostly cosmetic so each contributes a small share; gear and powerup contribute more.
   - outfit slots (×5): 0.4 share each → 2.0 combined
   - gear slots (×up to 4): 1.0 share each → 4.0 combined
   - powerup slot (×1): 2.0 share
   - Total share at endgame ≈ 8.0
2. **Per-rarity scaling** — common/rare items get fractional shares (common 0.05, rare 0.2, epic 0.5, legendary 1.0) so a mixed loadout sits well below ceiling.
3. **Bonus formula change** — instead of the current flat `RARITY_BONUS × slot_adj`, derive each item's `targetBonusPct` so that the expected combined endgame value approaches the ceiling but no single item dominates. Concretely:
   - generic bonus: `ceiling_bonus × share × rarity_factor / sum_of_shares_in_class`
   - boss bonus: same shape, only powerup + (½ on others) as today, but normalized to the +60% endgame budget.
   - crit chance: solved against `1 − Π(1 − p_i) ≤ ceiling_crit`, distributed by share.
4. **Discount stays non-stacking** — already best-wins; keep current per-item targets but document the cap (−30% legendary).
5. **Price formula** — keep the current `valueMult` shape but feed it the new (smaller) per-item percentages. Net effect: legendary prices come down a bit because per-item % is lower, but full-loadout power matches the design budget.

### Preview clarity
`RebalancePreviewModal` already has Crit % / Boss % columns. Add a small footer line like:
`"Endgame loadout ceilings — Bonus +150%, Discount −30%, Crit 35%, Boss +60%"`
so the admin understands what the per-item numbers add up to.

### Files
- `src/game/rebalance.ts` — new constants (`EQUIP_CAP`, `SLOT_SHARE`, `RARITY_FACTOR`, `ENDGAME_CEILING`), rewrite of `targetBonusPct` / `targetCritPct` / `targetBossBonusPct`.
- `src/components/RebalancePreviewModal.tsx` — add the ceilings footer line.

## Out of scope
- Changing slot counts / unlock progression.
- Changing the discount stacking rule.
- Migrating any DB rows beyond what running rebalance already does.
