## 1. Add "Study" as a new Gear category

**New slot:** `study` (passive equippable, like `accessory`/`chalk`).

**`src/game/data.ts`**
- Add `"study"` to the `Slot` union.
- Add `"Study"` to the `category` union on `ShopItem`.
- Add helper `gearSlotsUnlocked(level)` (see §2).

**`src/pages/Shop.tsx`**
- Update the `gear` group categories to: `["All", "Brushes", "Chalk", "Study"]`.

**Seed items** (admin uploads 360×360 webp art via existing flow later):
- `study_beta_book` — *Beta Book* (common, +3% all)
- `study_beta_breaker` — *Beta Breaker* (rare, +5% boulder/hard_boulder)
- `study_free_solo` — *Free Solo (doc)* — Consumable, one-shot +25% next log
- `study_magnus_yt` — *Magnus YT Binge* (rare, +4% boss attempts/sends)
- `study_wide_boyz` — *Wide Boyz Episode* (epic, +6% all)

Books = passive equippables in the new `study` slot. Videos/docs = `Consumables` (existing one-shot mechanic, no slot needed).

## 2. Generic gear slots, level-gated 1 → 4

Gear slots become **generic** — each unlocked slot can hold any gear-group item, with the rule "one of each gear type" (so you can't equip two Chalks, but you can equip 1 Chalk + 1 Brush + 1 Study).

**Unlock mapping (max 4):**
```text
Level 1–2  → 1 gear slot
Level 3–4  → 2 gear slots
Level 5–7  → 3 gear slots
Level 8+   → 4 gear slots
```

**`src/game/store.ts` — equip model unchanged**
- Items still equip to their own `slot` key (`chalk` / `accessory` / `study`), so the "one per type" rule is automatic.
- New check in `equipItem`: count currently-equipped gear items; if equipping a *new* gear type would exceed `gearSlotsUnlocked(state.level)`, reject with `{ ok: false, reason: "No free gear slot — level up to unlock more" }`. Replacing an already-equipped item in the same slot is always allowed.
- On state load/sync: if a user has more equipped gear items than allowed (e.g. they leveled down via admin), auto-unequip the lowest-bonus extras until within limit.

**`src/pages/Inventory.tsx`**
- Replace the fixed `chalk`/`accessory` slot rendering for the `gear` group with a single row of N generic slot cells, where N = `gearSlotsUnlocked(s.level)`.
- Cells are populated in equip order from `s.equipped` (any of `chalk`/`accessory`/`study`).
- Empty cells show a generic **"Empty Gear"** placeholder (not "Brush"). Locked cells (4 − N of them) show "Unlocks at Lv X".
- Update `SLOT_LABEL` to remove the "Brush" wording for empty UI; keep correct labels (`accessory: "Brush"`, `chalk: "Chalk"`, `study: "Study"`) for *equipped* items where the type is known.

## 3. Level copy
Update `LEVELS` `unlocks` strings in `src/game/data.ts` so gear-slot mentions match the 1/3/5/8 rule (remove stale "+1 Gear slot" lines on levels 4/7/10, add to 3/5/8).

## Out of scope
- No DB migration — `shop_items.slot` is `text`.
- No avatar art changes for Study items.

## Files touched
- `src/game/data.ts`
- `src/game/store.ts`
- `src/pages/Shop.tsx`
- `src/pages/Inventory.tsx`
