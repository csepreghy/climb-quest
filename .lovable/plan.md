## Time-to-Level-10 estimate

Level 10 requires **1,000,000 total Chalk** (cumulative cost). Chalk comes from boulders + bosses + strength, modified by your equipped buddy (+50% chalk default), gear/outfit perks, and the soft daily cap.

### Key mechanics in the math

- **Daily cap** grows with level: `100 + 25% × (cost to next level)`, plus up to `+750` from a 30-day streak.
- Past the cap, chalk earns at **×0.5**; past 2× cap, at **×0.2**. So practical max ≈ **1.5× cap/day** before it stops being worth grinding.
- Climbing Buddy adds **+50%** to chalk (assumed equipped throughout).

Effective daily cap at each level (no streak, with buddy):

```
Lv   Next-cost   Cap     ~Days at cap   Cumulative days
1→2     100      125         0.8             0.8
2→3     200      150         1.3             2.1
3→4     500      225         2.2             4.3
4→5    1,200     400         3.0             7.3
5→6    3,000     850         3.5            10.8
6→7   10,000   2,600         3.8            14.6
7→8   35,000   8,850         4.0            18.6
8→9  150,000  37,600         4.0            22.6
9→10 800,000 200,100         4.0            26.6
```

So even a daily-grinder who hits the cap **every day** needs ~**27 days minimum**, ~**18 days** if they push into the diminishing tiers.

### Sample session payouts (raw, before buddy ×1.5)

| Session | Activities | Raw chalk | With buddy |
|---|---|---|---|
| Light | 1 warm-up · 4 boulders · 1 send · 20 strength reps | 25+280+50+100 = 455 | **~680** |
| Standard | 2 warm-up · 6 boulders · 1 hard · 3 sends · 1 boss attempt · 40 reps | 50+420+150+150+60+200 = 1,030 | **~1,545** |
| Big day | 2 warm-up · 8 boulders · 2 hard · 1 project · 5 sends · 2 boss attempts · 80 reps | 50+560+300+250+250+120+400 = 1,930 | **~2,895** |
| Beast | + boss send + strength boss send + extra projects | ≈ 3,500 raw | **~5,200** |

### Estimated time to Level 10 by activity profile

Assumes climbing + strength mixed, buddy equipped, soft cap respected. Numbers round to whole weeks/months.

| Profile | Cadence | Per-session (with buddy) | Weekly chalk | Time to L10 |
|---|---|---|---|---|
| **Casual** | 2 sessions/wk (light) | ~680 | ~1,400 | **~14 years** |
| **Regular** | 3 sessions/wk (standard) | ~1,500 | ~4,500 | **~4.3 years** |
| **Committed** | 4 sessions/wk (standard + 1 big) | ~1,800 avg | ~7,200 | **~2.7 years** |
| **Dedicated** | 5 sessions/wk (mostly big days) | ~2,800 | ~14,000 | **~17 months** |
| **Hardcore** | 6–7 sessions/wk, hits daily cap most days | cap-limited | ~12k–25k early, scaling to ~200k/day at L9 | **~5–8 weeks** (cap-bound floor ≈ 27 days) |
| **Cap-floor (theoretical)** | Daily, max cap + streak + push into 0.5× tier | 1.5× cap/day | — | **~18 days** |

### What changes the estimate

- **Buddy rarity / chalk perk** above the default 50% shortens timelines proportionally (e.g. a 100% buddy roughly halves the casual/regular estimates).
- **Outfit + power-up chalk perks** stack multiplicatively and can shave 20–40% off mid-game.
- **Streak**: a maintained 30-day streak adds up to +750 chalk/day cap — meaningful at low levels, marginal at L8+.
- **Strength bosses** (+300 each) are the best chalk/effort ratio once unlocked; including them in every session noticeably accelerates the Committed/Dedicated tiers.
- **Daily cap is the real bottleneck** above Level 6. Even a Hardcore player can't go faster than ~4 days/level past L7 without diminishing returns.

### TL;DR

- **Hardcore daily grinder:** ~1–2 months
- **Dedicated 5×/week:** ~1.5 years
- **Regular 3×/week:** ~4 years
- **Casual 2×/week:** essentially endgame / multi-year goal

The cap curve is the dominant gate — content scaling (buddies, strength) mostly affects how quickly mid-tier players reach the cap, not the cap floor itself.
