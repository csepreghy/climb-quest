## Goal
Send a clean, product-update-style in-app notification to all users announcing the new **Strength Tier** feature.

## Feature Recap (for copy accuracy)
- **Rolling 7-day window** — no hard streak reset.
- A day qualifies with **≥10 combined reps** or **≥30s combined holds**, split across any exercises.
- **Bronze** (3–4 days) → +5% chalk  
- **Silver** (5–6 days) → +10% chalk  
- **Gold** (7 days) → +15% chalk & +5% crit
- Bonuses stack with existing climbing-streak chalk bonuses.
- Visible on Dashboard, Leaderboard, DailyCapBar, and the Strength log flow.

## Proposed Notification Copy

| Field | Value |
|-------|-------|
| **Type** | `feature_announcement` |
| **Priority** | `normal` |
| **Title** | Strength Tiers are here |
| **Body** | Log at least 10 reps or 30 seconds of holds on any day and it counts toward your 7-day Strength Tier. Bronze, Silver, and Gold tiers now give you bonus chalk on every send — and they stack with your climbing streak. No streak cliff: miss a day and you only drop one notch. |
| **Highlights** | • Rolling 7-day window — consistency, not perfection<br>• Bronze +5% chalk · Silver +10% · Gold +15% + crit<br>• Split reps/holds across any exercises you like |
| **Action label** | Check it out |
| **Action URL** | `/home` |

## Delivery Method
Insert a single row into the `notifications` table via the existing **Broadcast a Notification** admin panel (or an equivalent `supabase.from("notifications").insert(...)` call). Audience: `all`. No expiry needed.

## Out of Scope
- Push notifications
- Email blast
- In-app tooltip tour or spotlight UI