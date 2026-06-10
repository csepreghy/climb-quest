# Hangboard Sessions

A new training mode where users pick holds on a Beastmaker 1000, run a timed workout with audio cues, and earn Chalk + holds-tier progress.

## Scope (v1)

1. **Beastmaker 1000 overlay** — single image with absolute-positioned hold buttons (slopers, jugs, pockets, edges 45/35/20mm, mono).
2. **Workout library** — admin templates (curated) + user-created custom workouts.
3. **Workout runner** — full-screen timer with countdown, audio cues, hold highlighted on the board.
4. **Rewards** — completed hang seconds count toward the existing 7-day rolling **holds** tier (same as `strength_rep` holds today). Chalk via `BASE_CHALK.strength_rep` per second of hang. A new **Hangboard line** on the Dashboard chart, separate from Reps/Holds totals.
5. **Audio** — 3-beep countdown for the last 3 seconds of every phase; the third beep is longer-pitched to mark start/stop.

## User flow

```text
/hangboard           → pick a workout (My / Featured templates)
/hangboard/new       → custom builder (pick hold → set work/rest → add step → save)
/hangboard/run/:id   → full-screen runner: big timer, current hold highlighted on board,
                       next step preview, pause/skip, audio cues
                       → on finish: summary (total hang seconds, chalk earned, tier delta)
```

## Hangboard overlay

- Single Beastmaker 1000 image (generated via imagegen, stored in `src/assets/`).
- Hold definitions live in `src/game/hangboard/beastmaker1000.ts` as an array of `{ id, label, sizeMm, type, x, y, w, h }` in % coordinates.
- `<HangboardOverlay holds image onSelect activeHoldId />` renders the image plus absolute-positioned buttons. Reused by builder (tap to add), runner (highlight active), and admin editor.

## Workout data model

```ts
type HangStep =
  | { kind: "hang"; holdId: string; seconds: number }
  | { kind: "rest"; seconds: number };

type Workout = {
  id: string;
  name: string;
  description?: string;
  board: "beastmaker_1000";
  steps: HangStep[];
  createdBy: string | null;   // null = built-in/admin
  isTemplate: boolean;
};
```

## Database

One new table `public.hangboard_workouts`:

```text
id uuid pk, user_id uuid null (null = admin template),
name text, description text, board text,
steps jsonb, is_template bool, created_at, updated_at
```

RLS: users read templates + own rows; insert/update/delete own rows; admins manage templates. Includes the standard GRANT block.

Completed sessions are appended to `user_game_state.game.strengthSessions` (existing array) with a new `kind: "hangboard"` payload `{ workoutId, totalHangSeconds, completedAt, holds: [...] }`. This lets the existing 7-day holds rollup pick them up with no schema change, while the Dashboard can filter `kind==="hangboard"` for the new chart line.

## Audio

`src/game/hangboard/audio.ts` — small Web Audio helper:
- `beep(freq, durationMs)` using `OscillatorNode` + short gain envelope (no asset files).
- `countdown(secondsLeft, isFinal)` → 3 short 880 Hz beeps + 1 long 660 Hz beep on transition.
- Initialized on first user gesture (start button) to satisfy browser autoplay rules.
- Mute toggle persisted in localStorage.

## Files

New:
- `src/pages/Hangboard.tsx` (library list)
- `src/pages/HangboardBuilder.tsx` (custom workout editor)
- `src/pages/HangboardRunner.tsx` (timer + overlay)
- `src/components/hangboard/HangboardOverlay.tsx`
- `src/components/hangboard/WorkoutCard.tsx`
- `src/components/hangboard/StepList.tsx`
- `src/components/hangboard/HangboardChart.tsx` (Dashboard widget)
- `src/components/admin/HangboardAdmin.tsx` (admin templates CRUD)
- `src/game/hangboard/beastmaker1000.ts` (hold geometry)
- `src/game/hangboard/audio.ts`
- `src/game/hangboard/rewards.ts` (chalk calc + strengthSessions writer)
- `src/assets/hangboard-beastmaker1000.jpg` (generated)
- migration: `hangboard_workouts` table + RLS + GRANTs

Edited:
- `src/App.tsx` — add 3 routes
- `src/components/Layout.tsx` — nav entry "Hangboard"
- `src/pages/Dashboard.tsx` — embed `<HangboardChart />`
- `src/pages/Admin.tsx` — embed `<HangboardAdmin />`
- `src/game/strengthTier.ts` — include hangboard sessions in the rolling holds total

## Out of scope (v1)

- Multiple boards (Beastmaker 2000, Tension, custom uploads) — easy to add later via `board` field + another geometry file.
- Per-hold strength tiers (e.g. separate 20mm rolling total).
- Background-tab timer guarantees (rely on `setInterval` + `performance.now()` drift correction; if the tab is hidden the audio cues won't ring — we'll show a "keep this tab open" hint).
- Vibration / TTS cues.
- Sharing workouts between users.

## Open detail to confirm during build

Hold geometry will be hand-tuned against the generated image; the first runnable build will likely need one screenshot pass to nudge button positions. No user decision needed.
