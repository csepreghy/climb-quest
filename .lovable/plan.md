## Boss-defeat animation tweaks

Two files, small edits.

### `src/index.css`
- `player-charge`: hold still until 45% (≈0.5s of the 1.1s animation), then ease in with an exponential-style curve so the avatar accelerates from rest into the boss. Switch the class timing function to `cubic-bezier(0.7, 0, 0.84, 0)` (an "ease-in-expo" approximation) so motion ramps up sharply.
- `boss-knockout` + `impact-flash`: shift impact keyframes to ~66% to align with the new charge timing.

### `src/components/LogModal.tsx`
- `BossCelebrate`: bump particle count from 60 → 110, keep them small (3–6px), still triggered exactly at impact (`animationDelay ≈ 0.72s`), one-shot.

No other behavior changes.
