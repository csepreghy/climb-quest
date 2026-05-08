## Group-restricted item effects

Lock each effect to a specific item group so the catalog has a clear identity:

| Group | Allowed effects |
|---|---|
| Outfit | Chalk bonus (% + applies-to) |
| Gear | Crit chance %, Boss bonus % |
| Power-ups | Discount %, Chalk bonus (% + applies-to) |

Boss bonus and crit are gear-only. Discount is power-up-only. Chalk bonus is shared by outfit and power-ups.

### 1. Define the rule in one place
Add a small helper in `src/game/data.ts`:
```ts
export const GROUP_EFFECTS = {
  outfit: { chalk: true, crit: false, boss: false, discount: false },
  gear:   { chalk: false, crit: true,  boss: true,  discount: false },
  power:  { chalk: true,  crit: false, boss: false, discount: true  },
} as const;
```
Used by Admin form, rebalance, and any defensive runtime guards.

### 2. Admin form (`src/pages/Admin.tsx`)
- Hide the Bonus %, Discount %, Crit %, and Boss bonus % inputs based on the active `draft.group` using `GROUP_EFFECTS`.
- When the group changes, zero the now-disallowed fields in `draft` so they don't leak through `addCustomItem` / `updateCustomItem`.
- Defensive: in `customItems.ts` `inputToRow`, also zero disallowed fields by group as a backstop.

### 3. Rebalance (`src/game/rebalance.ts`)
Currently `targetBonusPct`, `targetDiscountPct`, `targetCritPct`, `targetBossPct` may suggest values regardless of group. Update each to return `0` for groups where that effect is disallowed, so the rebalance preview never re-introduces stripped effects.

### 4. One-time data migration
Run an UPDATE on `shop_items` that zeroes invalid effect columns:
- `group='outfit'` → `crit_chance_pct=0`, `boss_bonus_pct=0`, `price_mult=1`
- `group='gear'` → `bonus_pct=0`, `applies_to='"all"'`, `price_mult=1`
- `group='power'` → `crit_chance_pct=0`, `boss_bonus_pct=0`

(Done via the data-update tool, not a schema migration.)

### 5. Shop card display (`src/pages/Shop.tsx`)
No structural change needed — the card already reads whichever fields are present. After the migration only valid badges will show.

### Out of scope
- No schema/column changes.
- Inventory equip/loadout math (`Inventory.tsx`) keeps working as-is since stripped fields are now `0`/`undefined`.
- No change to consumables or level-req logic.
