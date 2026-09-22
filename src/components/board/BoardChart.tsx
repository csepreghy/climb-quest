import { useMemo } from "react";
import { GameCard } from "@/components/ui/game-card";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import { useBoardSessions } from "@/game/board/store";
import { V_GRADES, rankToVLabel } from "@/game/board/grades";
import type { BoardSessionRow } from "@/game/board/types";
import { ChartMotion, ChartRangeControls, useChartRange } from "@/components/charts/ChartRangeControls";

/** Weekly board climbs + top grade rank for the last 13 weeks. */
export function BoardChart({ sessions: providedSessions }: { sessions?: BoardSessionRow[] }) {
  const local = useBoardSessions();
  const sessions = providedSessions ?? local.sessions;
  const range = useChartRange();

  const data = useMemo(() => {
    const start = new Date(range.start);
    const dow = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dow);

    type Wk = { ts: number; label: string; climbs: number; lastRank: number | null; lastTs: number };
    const weeks: Wk[] = [];
    for (let ws = new Date(start); ws <= range.end; ws.setDate(ws.getDate() + 7)) {
      weeks.push({
        ts: ws.getTime(),
        label: ws.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        climbs: 0,
        lastRank: null,
        lastTs: 0,
      });
    }
    const earliest = weeks[0]?.ts ?? range.start.getTime();
    const idxFor = (d: Date) => {
      const day = new Date(d); day.setHours(0,0,0,0);
      const t = day.getTime();
      if (t < earliest) return -1;
      for (let i = weeks.length - 1; i >= 0; i--) if (weeks[i].ts <= t) return i;
      return -1;
    };

    for (const s of sessions) {
      const d = new Date(s.logged_at);
      const i = idxFor(d);
      if (i < 0 || d < range.start || d > range.end) continue;
      weeks[i].climbs += 1;
      const ts = d.getTime();
      if (ts >= weeks[i].lastTs) {
        weeks[i].lastTs = ts;
        weeks[i].lastRank = s.grade_rank;
      }
    }
    return weeks;
  }, [sessions, range.start, range.end]);

  return (
    <GameCard className="p-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="menu-label mb-0 flex items-center gap-1.5"><TrendingUp className="h-3 w-3" /> Board · climbs &amp; last grade</h3>
        <ChartRangeControls start={range.start} end={range.end} months={range.months} monthOffset={range.monthOffset} onEarlier={range.moveEarlier} onLater={range.moveLater} onMonthsChange={range.changeMonths} />
      </div>
      <ChartMotion animationKey={range.animationKey} direction={range.direction} className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="boardClimbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="hsl(var(--rare))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--rare))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="climbs" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <YAxis
              yAxisId="grade"
              orientation="right"
              stroke="hsl(var(--legendary))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={36}
              domain={[0, V_GRADES.length - 1]}
              allowDecimals={false}
              tickFormatter={(v: number) => rankToVLabel(v)}
            />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: any, name: string) => {
               if (name === "Last grade") return [v == null ? "—" : rankToVLabel(Number(v)), name];
                return [`${v} climbs`, name];
              }}
            />
            <Area yAxisId="climbs" type="monotone" dataKey="climbs" name="Board climbs" stroke="hsl(var(--rare))" strokeWidth={2} fill="url(#boardClimbGrad)" />
            <Line yAxisId="grade" type="monotone" dataKey="lastRank" name="Last grade" stroke="hsl(var(--legendary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--legendary))" }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartMotion>
    </GameCard>
  );
}
