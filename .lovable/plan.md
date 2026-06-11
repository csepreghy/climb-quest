## Goal

Replace the AI-generated hangboard art with the supplied cartoon Beastmaker 1000 illustration, rebuild the clickable hold map against the white reference, and treat mirrored holds as a single logical hold so hovering/selecting/highlighting lights up both sides at once.

## Holds (from the white reference)

Each numbered hold on the reference exists either as a **symmetric pair** (left + right) or as a single centre hold. We model one logical "hold" per number, and each logical hold owns 1–2 physical positions on the board.

Top row:
- `n1` — 4-finger edge, 15mm — pair (outer corners)
- `n2` — 3-finger edge, 30mm — pair (inner top)

Middle row:
- `n3` — 4-finger edge, 45mm — pair (outer)
- `n4` — deep 2-finger pocket, 50mm — pair
- `n5` — deep 3-finger pocket, 45mm — pair
- `n6` — 4-finger edge, 50mm — **single, centre**

Bottom row:
- `n7` — 4-finger edge, 20mm — pair (outer, the ones with the dotted monos in the cartoon)
- `n8` — 2-finger pocket, 25mm — pair
- `n9` — 3-finger pocket, 20mm — pair (inner bottom)

Total: **9 logical holds**, **17 physical positions**. The two decorative "CQ" scoops on the top row stay non-interactive.

## Changes

**1. Asset swap**
- Upload `user-uploads://hangboard_item.png` via `lovable-assets` to `src/assets/hangboard-beastmaker1000.png.asset.json`.
- Delete the old `src/assets/hangboard-beastmaker1000.jpg` (and its `.asset.json` pointer if present).
- In `src/components/hangboard/HangboardOverlay.tsx` switch the `import boardImg` to the new pointer (`pointer.url`), and update the `<img>` intrinsic `width`/`height` to 1920×640.

**2. New hold model in `src/game/hangboard/beastmaker1000.ts`**
- Change `HangboardHold` so each entry owns an array of `positions: { x, y, w, h }[]` (1 or 2 entries) instead of a single box.
- Replace `BEASTMAKER_1000_HOLDS` with the 9 entries above. Approximate coordinates (% of 1920×640 image, calibrated by eye against the cartoon; will be nudged after first render):
  - `n1` (top, y≈24%, h≈14%, w≈11%) — left x≈7, right x≈82
  - `n2` (top, y≈24%, h≈14%, w≈9%) — left x≈33, right x≈47
  - `n3` (mid, y≈42%, h≈16%, w≈10%) — left x≈7, right x≈83
  - `n4` (mid, w≈10%) — left x≈19, right x≈71
  - `n5` (mid, w≈10%) — left x≈31, right x≈59
  - `n6` (mid, w≈14%) — single x≈43
  - `n7` (bottom, y≈63%, h≈16%, w≈11%) — left x≈7, right x≈82
  - `n8` (bottom, w≈11%) — left x≈19, right x≈58
  - `n9` (bottom, w≈11%) — left x≈32, right x≈45
- Labels follow the reference, e.g. `"15mm Edge"`, `"30mm Edge"`, `"45mm Edge"`, `"2-finger 50mm Pocket"`, `"3-finger 45mm Pocket"`, `"50mm Edge"`, `"20mm Edge"`, `"2-finger 25mm Pocket"`, `"3-finger 20mm Pocket"`.
- Keep `HOLD_BY_ID` and `holdLabel` exports working.

**3. `HangboardOverlay` renders pairs as one unit**
- Iterate holds, then iterate each hold's `positions`. All buttons for the same hold share `hover`/`active` state, so hovering one lights up its twin and clicking either fires `onSelect(hold)` once. `activeHoldId` already keys by hold id, so the runner's existing highlight call will light up both positions automatically.
- The numeric/label tooltip and ring style stay the same; just rendered twice for paired holds.

**4. Runner / Builder side**
- `HangboardBuilder` and `HangboardRunner` already operate on `holdId`, so no logic change is needed once the data model is per-hold. `holdLabel(step.holdId)` keeps working.

**5. Legacy data compatibility**
- Old saved workouts reference ids like `edge_20`, `mono_l`, `jug_l`, etc. Add a small `OLD_TO_NEW_ID` map in `beastmaker1000.ts` and have `HOLD_BY_ID`/`holdLabel` fall through it (e.g. `edge_20 → n7`, `mono_l/mono_r → n9`, `pocket_l/pocket_r → n8`, `edge_45 → n3`, `edge_35 → n2`, `jug_l/jug_r → n1`). No DB migration; old workouts just render with the new labels.

## Out of scope
- Visual restyling of the overlay buttons (rings, hover colours stay as-is).
- Pixel-perfect calibration — the coordinates above are eyeballed and will be nudged after seeing the first render.
- Any change to workout builder/runner logic, rewards, or routes.

## Open question
The two decorative "CQ"-logo scoops on the top row: keep them purely decorative (current plan), or also model them as a 10th "sloper" hold pair?
