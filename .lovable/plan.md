
# Progression rebalance plan

A complete overhaul of level thresholds, base chalk, item pricing/bonuses, and a new **relative-difficulty** scaler. Numbers are concrete starting points — easy to tune in `data.ts` later.

## 1. Design principles

- **First 2 weeks = dopamine.** Levels 1–4 reachable in ~1–2 weeks of casual logging (3 sessions/week). Several common items affordable after the first session.
- **Months 1–3 = the buying loop.** From Level 5 onward, raw chalk income alone is too slow to level up — the player MUST buy and equip bonus items to keep climbing the curve. Each new tier of items unlocks ~+25–40% effective income.
- **Months 4–6 = the grind with payoff.** Level 9–10 require deep stacking of legendary bonuses + price-reduction gear + boss sends. Reaching Lv 10 on a 3×/week cadence ≈ 5–6 months.
- **Stacking is multiplicative on running subtotal** (already implemented in `computeChalk`), so each new item compounds — late-game items should give **larger %** but cost disproportionately more.
- **Relative-difficulty scaling** keeps grade-1 warm-ups meaningful for beginners and trivial for veterans — pushes advanced players to log harder problems and bosses.

## 2. Level thresholds (chalk to reach next level)

Replace `LEVELS[i].cost` (currently 0, 200, 500, 1.1k, 2.2k, 4.2k, 7.8k, 14k, 24k, 40k → ~94k total).

| Lv | New cost | Cumulative | Feel |
|----|---------:|-----------:|------|
| 1  | 0       | 0       | start |
| 2  | 150     | 150     | first session |
| 3  | 400     | 550     | day 2–3 |
| 4  | 1,000   | 1,550   | week 1 |
| 5  | 2,500   | 4,050   | week 2–3 — gear slot 3 |
| 6  | 6,000   | 10,050  | month 1 |
| 7  | 14,000  | 24,050  | month 2 |
| 8  | 32,000  | 56,050  | month 3 — gear slot 4 |
| 9  | 70,000  | 126,050 | month 4–5 |
| 10 | 150,000 | 276,050 | month 5–6 endgame |

Curve is roughly ×2.2/level — steeper than today, but income scales with item bonuses (see §4).

## 3. Base chalk + relative-difficulty scaler

Keep `BASE_CHALK` numbers (or slightly tune), and apply a **difficulty multiplier** based on `gradeClimbed` vs `playerCeiling`, where `playerCeiling` = the highest boss grade-rank the player has sent (default 1 if none).

```text
diffRatio = gradeRank(climb) / playerCeiling
multiplier =
  diffRatio <= 0.3   → 0.25   (waaay below — you’re basically jogging)
  diffRatio <= 0.6   → 0.55
  diffRatio <= 0.85  → 0.85
  diffRatio <= 1.0   → 1.0
  diffRatio <= 1.15  → 1.25   (at-limit)
  diffRatio  > 1.15  → 1.5    (project zone)
```

`gradeRank` reads the V-scale or French-scale index from `gyms.ts` (or the gym's custom system). Bosses already store `difficulty` (1–10), so `playerCeiling = max(difficulty of sent bosses)`.

Effects:
- New player (no boss sent): everything ≥ ratio 1, so they keep getting full base chalk → fast early ramp.
- Player who sent a difficulty-6 boss: a "grade 1 warm-up" → diffRatio ≈ 0.17 → ×0.25 multiplier (≈8 chalk for a warm-up boulder vs 30) — feels right.
- Logging at-limit problems pays a 25% bonus, projects 50%.

Tuned base values:
```
warmup_boulder: 25
boulder:        70
hard_boulder:   150
boulder_send:   +50  (flat add-on)
boss_attempt:   60
boss_send:      400  (boss sends are the big push)
```

## 4. Item bonuses & pricing

Items are admin-managed in the `shop_items` table — this plan defines **target ranges** the admin tool will use, plus a recommended starter catalogue migration.

### Bonus tiers

| Rarity     | Bonus %  | Typical level req | Price range |
|------------|---------:|------------------:|------------:|
| Common     | +3–5%    | Lv 1–3            | 100–600     |
| Rare       | +6–10%   | Lv 3–6            | 1,500–6,000 |
| Epic       | +12–18%  | Lv 5–8            | 10,000–35,000 |
| Legendary  | +22–30%  | Lv 8–10           | 60,000–180,000 |

Single-slot items give a flat % to **all** activities. Style-matched items (e.g. "Crimp Gloves" applies only to crimp logs) carry a **higher** % at the same price, rewarding specialisation.

### "Pricing math" check (3 sessions/week, ~12 logs/session)

- Lv 1 → 2 with no items: ~150 chalk in 1 session ✓
- Lv 4 → 5 with 2 commons (+8% combined): ~3k base/week × 1.08 → ~3.2k → ~1 week ✓
- Lv 7 → 8 needs 32k. With 1 rare + 1 epic + 1 common (+~25%): ~5k/week × 1.25 → 6.2k/week → ~5 weeks ✓
- Lv 9 → 10 needs 150k. With full epic + 2 legendaries (+~70%): ~9k/week × 1.7 → 15k/week → ~10 weeks ✓ (months 5–6)

If the math feels off after playtest, only `LEVELS[].cost` and the rarity ranges need to move.

### Should some items reduce shop prices?

**Yes — recommended.** Adds genuine build-diversity instead of "always pick highest %". Two options, I recommend (a):

- **(a) Discount-tagged gear (preferred):** introduce a new optional field `priceMult` on `ShopItem` (e.g. 0.95 = 5% cheaper shop). Equipped discounts stack multiplicatively on item price at the moment of purchase (computed in `buyItem`). One per slot makes sense (e.g. "Merchant's Belt" accessory). Discounts apply to outfit/gear/power purchases — not level-ups.
- (b) Consumable coupons — single-use 20% off one purchase. Less interesting strategically.

Why this is good: a player at Lv 7 deciding between "+15% chalk gloves" and "−10% prices belt" has a real tradeoff — the gloves help income forever, the belt frontloads a big-item buy. It also creates a "save up for Lv 10 outfit" archetype.

UI/code touch points: `Shop.tsx` displays struck-through original price + new price; `buyItem` in `store.ts` computes effective price using equipped discounts.

## 5. Migration / implementation steps (for build mode)

1. **`src/game/data.ts`** — update `LEVELS[].cost`, tweak `BASE_CHALK`, add `priceMult?: number` to `ShopItem`.
2. **`src/game/store.ts`** —
   - Add `playerCeiling(state)` selector (max difficulty of sent bosses, default 1).
   - Add `difficultyMultiplier(climbRank, ceiling)` and apply it inside `computeChalk` (right after `base`, before any other bonuses).
   - In `buyItem`, compute `effectivePrice = item.price × ∏(equipped priceMult)`.
3. **`src/game/gyms.ts`** — small helper `gradeRank(label, system)` returning a 1–N rank for a grade label (V-scale, French, custom number/color).
4. **`src/components/LogModal.tsx`** — pass the gym's grade rank into `logBoulder`/`computeChalk` so the multiplier can fire.
5. **`src/pages/Shop.tsx`** — render discounted price when `priceMult < 1`.
6. **`shop_items` table** — add `price_mult numeric not null default 1` column via migration; admin form gets a "Shop discount %" field.
7. **Admin seeder** — optional one-time button in `Admin.tsx` to populate a starter catalogue matching §4 ranges (so a fresh DB isn't empty).

## 6. Open questions (will ask before building)

- Do you want the difficulty scaler to also apply to **boss attempts/sends**, or only regular boulder activities? (My default: only regular boulders + warm-ups; bosses keep full payout because they're already gated.)
- Discount items: cap total discount (e.g. min 60% of list price) so stacking doesn't trivialize Lv 10 items?
- Is 3 sessions/week the right "target player" cadence to design around, or something else (2/week, 4/week)?
