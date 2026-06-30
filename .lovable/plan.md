# Board Training — Plan

A new log type "Board" alongside Boulder, Strength, Hangboard. Tracks MoonBoard and Kilter Board climbs, awards Chalk based on grade relative to user's PR, and shows on the dashboard.

## 1. Assets

Upload the two provided images via lovable-assets:
- `src/assets/board-moonboard.webp.asset.json`
- `src/assets/board-kilter.webp.asset.json`

Used as the picker tiles inside the modal and as the icon on the type picker.

## 2. Data model (Lovable Cloud)

New table `board_sessions`:
- `user_id`, `logged_at` (date), `board_type` ('moonboard' | 'kilter')
- `moonboard_variant` (text, nullable) — one of: `mb_2016`, `mb_2017`, `mb_2019`, `mini_mb_2020`, `mb_2024`, `mini_mb_2025`
- `kilter_angle` (int, nullable) — degrees, user-configurable (e.g. 25/30/40/45/50/55/60/65/70)
- `problem_name` (text, nullable)
- `is_benchmark` (bool)
- `is_flash` (bool)
- `grade_system` ('v' | 'french')
- `grade` (text, e.g. "V5" or "7A+")
- `grade_rank` (int) — normalized rank used for PR / chalk calc, stored at write time
- `chalk_awarded` (int)

RLS: user can CRUD their own rows. Grants for `authenticated` + `service_role`.

User preferences (stored in existing profile / localStorage):
- `last_board_type`, `last_moonboard_variant`, `last_kilter_angle`, `last_grade_system`, `kilter_angle_options` (custom list).

## 3. Grade normalization

`src/game/board/grades.ts`:
- V scale: V0..V17 → ranks 0..17.
- French boulder scale: 4, 5, 5+, 6A, 6A+, 6B, 6B+ … 9A. Map each to nearest V rank (standard conversion table).
- Helpers: `parseGrade`, `gradeRank`, `gradesForSystem`.

## 4. Chalk reward formula

```
diff = userMaxRank - newRank
if newRank > userMaxRank → 200 (new PR)
diff <= 0  → 200 (ties PR — treat as PR-equal)  *suggested tweak*
diff 1-2  → 100
diff 3-4  → 50
diff >= 5 → 25
```

Then multiplied by the existing chalk bonuses (outfit/gear/buddy %, crit chance, etc.) — same pipeline as boulder logs. Flash adds a small bonus (+25%, matches existing flash treatment if present; otherwise additive +25 chalk — to confirm with existing boulder logic).

Suggestion to highlight to user: also award +50 bonus chalk the first time a specific `(board_type, variant/angle, problem_name)` is sent (first ascent for that user) to encourage variety. Optional — included behind a simple check.

## 5. UI

### LogModal type picker
Add a 4th tile "Board" using a small board icon. Order: Boulder, Strength, Hangboard, Board.

### BoardLogModal (`src/components/board/BoardLogModal.tsx`)
- Top: two large image tiles (MoonBoard / Kilter) — `.tile-3d` style. Selected one glows.
- If MoonBoard → select variant (segmented control / dropdown).
- If Kilter → select angle from configured list + "Edit angles" link opening a small inline editor (chips with + / remove).
- Date picker (defaults today).
- Grade system toggle (V / French).
- Grade selector (scroll list filtered by system).
- Problem name (text input, optional).
- Benchmark checkbox.
- Flash checkbox.
- Notes (optional, suggested).
- Submit → writes row, computes chalk, fires celebratory modal.

### Celebration
Reuse existing chalk-earned celebratory pattern. Two variants:
- Standard: chalk bag asset + "+X Chalk".
- **New PR**: bigger banner, gold glow, message like "NEW HIGH GRADE — VX!" plus chalk amount.

### History / logs
In existing logs lists, render board entries with:
- Board icon + label ("MoonBoard 2019" or "Kilter 40°")
- Grade chip, problem name, Benchmark/Flash badges, date.

### Dashboard
New chart card "Board progression" — only renders when user has ≥1 board session:
- Weekly aggregation.
- Two lines: highest grade (rank) and number of climbs.
- Mirrors the existing boulder chart styling.

Hangboard chart: hide when user has 0 hangboard sessions.

## 6. Files to add / change

Add:
- `src/assets/board-moonboard.webp.asset.json`, `src/assets/board-kilter.webp.asset.json`
- `src/game/board/types.ts`, `src/game/board/grades.ts`, `src/game/board/rewards.ts`, `src/game/board/store.ts`
- `src/components/board/BoardLogModal.tsx`
- `src/components/board/BoardPRCelebration.tsx` (or extend existing celebration)
- `src/components/board/BoardChart.tsx`

Change:
- `src/components/LogModal.tsx` — add Board tile in type picker, route to BoardLogModal.
- `src/pages/Dashboard.tsx` — mount BoardChart conditionally; hide hangboard chart when 0 sessions.
- Existing logs list component(s) — render board entries.
- Supabase migration for `board_sessions` (+ RLS + grants).

## 7. Open questions / suggestions for you

1. Tie-with-PR (same rank as current max) — award 200 (treated as PR) or 100? Default = 200.
2. Flash bonus: keep at +25% chalk (matches boulder convention) — OK?
3. First-ascent-of-that-problem bonus (+50): include or skip? Default = include.
4. Kilter default angle options: 25/30/40/45/50/55/60/65/70 — OK as initial list?
5. Should board climbs count toward daily chalk cap the same way boulders do? Default = yes.
