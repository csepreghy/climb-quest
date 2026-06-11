
## Goal

Shrink the nav by folding Hangboard into the Log section, and surface it from Home instead.

## Changes

**1. `src/components/Layout.tsx`**
- Remove the Hangboard entry from the `NAV` array (both desktop and mobile bottom bar). Routes stay registered in `App.tsx` so deep links keep working.

**2. `src/pages/LogBoulder.tsx`** (the `/log` page)
- Add a third tab alongside **Boulders** and **Strength** called **Hangboard**.
- When selected, render the existing Hangboard listing (featured templates + my workouts) by reusing the content from `src/pages/Hangboard.tsx`. Simplest path: extract that page's body into a `<HangboardPanel />` component and render it from both `/hangboard` (kept for deep links) and the new tab.
- The top-right "Log" button stays as-is for boulders/strength; on the Hangboard tab it changes to "New workout" → `/hangboard/new`.

**3. `src/pages/Dashboard.tsx` (Home)**
- Add a Hangboard quick-action button near the existing primary actions (e.g. next to the Log CTA). Uses the `Dumbbell` icon and routes to `/hangboard`.
- Styled to match the existing dashboard action buttons — no new design language.

## Out of scope

- No route removal in `App.tsx` — `/hangboard`, `/hangboard/new`, `/hangboard/edit/:id`, `/hangboard/run/:id` stay.
- No changes to hangboard data, rewards, or workout builder/runner.
- Broader nav restructure (Training / Locker / Community) is deferred.

## Open question

On Home, do you want the Hangboard button as a **secondary button next to the existing Log CTA**, or as its **own card lower on the page** (more prominent, more space)?
