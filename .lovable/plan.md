## Goals

1. Admins can fully edit public gyms they created (not just delete).
2. Add a Country dropdown to gym forms — all of Europe + US.
3. Stop forcing users to set up a gym before logging climbs.
4. Rename onboarding's final button from "Set up my gym" to "Start climbing" and route to home.
5. Answer: do daily chalk / boss limits exist?

## Answer to question 4

No daily caps exist today. `src/game/store.ts` has only one related guard: `hasBossSendOnDate(dateISO)` (line 525), which reports whether a boss was already sent on a given date — but it's just a query helper. It is not enforced anywhere as a hard limit. There are no daily chalk maximums, no per-day boulder caps, and no per-day boss-attempt caps. If we want them, that's a separate follow-up.

## Changes

### 1. Admins can edit their public gyms
File: `src/pages/Admin.tsx` (the `PublicGymsAdmin` section)

Today admins can only add/delete public gyms and change name/location inline. Extend it so admins can edit a public gym in place with the same controls users get for their own gyms:
- Name, location, country
- Hold colors (add / remove, including the new multicolor option)
- Grading systems assigned to the gym
- Custom grading systems attached to the public gym (separate from the user's local custom systems)

Reuse the existing components from `src/pages/MyGym.tsx` by extracting the gym editor body and the `AddHoldColor` / grading-system editors into a shared component that accepts a `source: "local" | "public"` prop. The component dispatches to either the local `gyms.ts` mutators or the `publicGyms.ts` mutators (`updatePublicGym`, `setPublicGymGradingSystems`).

### 2. Country dropdown
- Add `country?: string` to the `Gym` interface in `src/game/gyms.ts` (and matching field in `addPublicGym` / `addGym`).
- New file `src/game/countries.ts` exporting an ordered list of geographic Europe + US (United States first, then alphabetical European countries: Albania, Andorra, Austria, Belarus, Belgium, Bosnia and Herzegovina, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Iceland, Ireland, Italy, Kosovo, Latvia, Liechtenstein, Lithuania, Luxembourg, Malta, Moldova, Monaco, Montenegro, Netherlands, North Macedonia, Norway, Poland, Portugal, Romania, San Marino, Serbia, Slovakia, Slovenia, Spain, Sweden, Switzerland, Türkiye, Ukraine, United Kingdom, Vatican City).
- Add a `<Select>` Country field next to Name/Location in:
  - `src/pages/MyGym.tsx` add-gym form and per-gym editor
  - `src/pages/Admin.tsx` public gyms add + editor
- Country shows under the gym name where location is currently shown (as `Location · Country`).

### 3. Don't force users to set up a gym before logging
File: `src/components/Layout.tsx`
- Remove the `needGymOpen` modal and the `tryOpenLog` gating; "Log Boulder" buttons open the log modal directly.
- File: `src/components/LogModal.tsx` — when the user has no gyms, show an inline empty-state inside the modal: short message + a "Set up a gym" button that links to /my-gym, and the form fields that depend on a gym (gym selector, hold color, grading system) gracefully fall back to the built-in V scale with no hold color, so a user can still log a climb without a gym.

### 4. Onboarding final step → "Start climbing"
File: `src/components/OnboardingModal.tsx`
- Change last-step button label from "Set up my gym" to "Start climbing" (keep the icon or swap to a Play/Sparkles icon).
- On click, mark onboarding complete and `navigate("/")` instead of `/my-gym`.
- The "gym" onboarding step copy stays (still teaches gym setup) but the CTA no longer forces them there.

## Technical details

- `Gym.country` is optional so existing saved gyms don't break. Display falls back to just `location` when missing.
- The shared gym editor component lives at `src/components/GymEditor.tsx`. Props:
  ```ts
  { gym: Gym; gradingSystems: GradingSystem[]; source: "local" | "public" }
  ```
  Internally it picks the right mutator set. Both `MyGym.tsx` and `Admin.tsx` render it.
- `publicGyms.ts` already has `updatePublicGym` and `setPublicGymGradingSystems`; we'll add `addPublicHoldColor`, `removePublicHoldColor`, `togglePublicGymGradingSystem` as thin helpers that call `updatePublicGym` with the patched gym.
- For public-gym custom grading systems we manage them inside the `grading_systems` jsonb column via `setPublicGymGradingSystems`.
- No DB migration needed — `country` lives inside the existing `data` jsonb on `public_gyms` and inside the local `gyms` json blob.

## Out of scope

- Adding actual daily caps for chalk or boss attempts (only flagged the absence).
- Country flags/icons in the dropdown.
- Searchable/typeahead country picker (plain Select is fine for ~46 entries).
