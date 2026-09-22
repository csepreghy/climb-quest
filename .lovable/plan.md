# Plan: Chart history navigation

## Goal
Let users browse older chart history by month and choose 1, 3, 6, or 12-month windows across every chart, including charts for other leaderboard users.

## Implementation
- Inventory every chart and confirm each data source supports historical ranges.
- Add a reusable chart-period control with left/right month arrows, a top-right timeframe selector, and disabled forward navigation when already at the current period.
- Make 3 months the default; support 1, 3, 6, and 12 months.
- Recompute labels and aggregates from the selected visible window, preserving each chart’s current metric and appearance.
- Animate chart changes in the navigation direction, while respecting reduced-motion preferences.
- Apply the same controls to leaderboard views of other users.
- Verify representative charts at desktop and mobile sizes, including older history and return-to-present navigation.

## Technical details
- Keep navigation state local to each chart unless existing page structure supports a shared period state.
- Use calendar-month boundaries rather than fixed day counts so arrows always jump exactly one month.
- Cap the right arrow at the current month and avoid fabricating missing historical data.
