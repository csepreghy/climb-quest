## Goal

Rebalance level thresholds, item prices, and item bonuses so early progression feels fast, late progression is a grind, and L10 takes ~6 months at 2–3 sessions/week (~3 months at 4/week). L10 cost = **1,000,000 chalk**. Chalk-reward scaling stays as previously implemented; this plan focuses on *thresholds, prices, bonuses, and discount items*.

## 1. Level thresholds (`src/game/data.ts` → `LEVELS`)

Replace `cost` values with a steep curve. Cumulative ≈ 1.27M.

| Lv | Cost to reach | Cumulative |
|----|--------------:|-----------:|
| 1  | 0             | 0          |
| 2  | 100           | 100        |
| 3  | 300           | 400        |
| 4  | 800           | 1,200      |
| 5  | 2,000         | 3,200      |
| 6  | 5,000         | 8,200      |
| 7  | 15,000        | 23,200     |
| 8  | 50,000        | 73,200     |
| 9  | 200,000       | 273,200    |
| 10 | **1,000,000** | 1,273,200  |

Pacing math: ~65 sessions in 6 months at 2.5/wk; with stacked bonuses + at-limit difficulty multiplier, late-game sessions earn 10k–20k chalk, making the L10 jump intentionally heavy but achievable.

## 2. Item bonuses (overwrite `bonus_pct` in `shop_items`)

New tiering (all values are `bonus_pct`, applied as `+%` chalk):

- Common: **2%**
- Rare: **6%**
- Epic: **15%**
- Legendary: **35%**

Applied to every existing item by rarity (specific overwrites listed in section 5).

## 3. Item prices (overwrite `price` in `shop_items`)

Tier price bands (rounded per slot importance):

- Common: 50–150
- Rare: 400–1,500
- Epic: 5,000–15,000
- Legendary: 60,000–180,000

## 4. Shop-discount items (single source, no stacking)

Per your call, **only the `study` slot** provides shop discounts. Their `bonus_pct` becomes 0 and `price_mult` carries the discount. Only the lowest equipped `priceMult` applies (already implemented).

| Item                  | Rarity     | Lv req | Price   | priceMult | Discount |
|-----------------------|------------|-------:|--------:|----------:|---------:|
| Beta Book             | rare       | 2      | 600     | 0.95      | 5% off   |
| Beta Breaker Book     | epic       | 4      | 6,000   | 0.85      | 15% off  |
| **Sponsor Deal** (new)| legendary  | 8      | 80,000  | 0.70      | 30% off  |

The new legendary study item will be inserted via migration. (If you'd rather rename one of the existing legendaries instead of adding, say so.)

## 5. Concrete per-item overwrites (UPDATE migration)

All current rows updated to:

| Item                       | Rarity    | New price | New bonus% | priceMult |
|----------------------------|-----------|----------:|-----------:|----------:|
| Reliable Powder            | common    | 50        | 2          | 1         |
| Liquid Chalk               | rare      | 500       | 6          | 1         |
| Sticky                     | rare      | 1,200     | 6          | 1         |
| Magdust                    | epic      | 8,000     | 15         | 1         |
| Cosmic Magdust             | legendary | 120,000   | 35         | 1         |
| Toe Hook Master            | rare      | 800       | 6          | 1         |
| Comfy Beginner Shoes       | rare      | 600       | 6          | 1         |
| Comp                       | epic      | 7,000     | 15         | 1         |
| Golden Crocs               | legendary | 150,000   | 35         | 1         |
| Shorts                     | common    | 100       | 2          | 1         |
| Pants                      | rare      | 700       | 6          | 1         |
| Rental                     | common    | 50        | 2          | 1         |
| Climbing Tape              | common    | 80        | 2          | 1         |
| Crack Climbing Gloves      | epic      | 5,000     | 15         | 1         |
| Bear Paw Glove             | legendary | 90,000    | 35         | 1         |
| Infinity Climbing          | legendary | 100,000   | 35         | 1         |
| No Hats                    | common    | 0         | 0          | 1         |
| Bare Bones                 | common    | 0         | 0          | 1         |
| Baseball Cap               | rare      | 500       | 6          | 1         |
| Cool Beanie                | epic      | 6,000     | 15         | 1         |
| Sender Hoodie              | epic      | 9,000     | 15         | 1         |
| Shirtless                  | legendary | 80,000    | 35         | 1         |
| Beta Book                  | rare      | 600       | **0**      | **0.95**  |
| Beta Breaker Book          | epic      | 6,000     | **0**      | **0.85**  |
| Sponsor Deal *(insert)*    | legendary | 80,000    | 0          | 0.70      |

## 6. Files / migrations

- **Migration**: `UPDATE shop_items SET ...` per row above; `INSERT` Sponsor Deal row.
- **`src/game/data.ts`**: rewrite `LEVELS` cost values.
- No code logic changes needed — discount + bonus systems already wired.

## Open questions

- Insert a new legendary study item ("Sponsor Deal") or repurpose an existing legendary into the discount role? Default: insert new.
- Keep current chalk reward base values (unchanged from last pass)? Default: yes.
