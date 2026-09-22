import { useMemo } from "react";
import { GameCard } from "@/components/ui/game-card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useGame } from "@/game/store";
import type { StrengthSession } from "@/game/store";
import { ChartMotion, ChartRangeControls, useChartRange } from "@/components/charts/ChartRangeControls";

/**
 * Daily hangboard hang-seconds for the trailing 14 days.
 * Reads from strengthSessions where workout === "hangboard".
 */
export function HangboardChart({ sessions }: { sessions?: StrengthSession[] }) {
  const s = useGame();
  const source = sessions ?? s.strengthSessions ?? [];
  const range = useChartRange();
  const data = useMemo(() => {
    const out: { day: string; seconds: number }[] = [];
    const start = new Date(range.start); start.setHours(0, 0, 0, 0);
    const end = new Date(range.end); end.setHours(0, 0, 0, 0);
    const dayKey = (d: Date) => d.toDateString();
    const totals: Record<string, number> = {};
    for (const ss of source) {
      if ((ss.workout as string) !== "hangboard") continue;
      const k = dayKey(new Date(ss.date));
      totals[k] = (totals[k] ?? 0) + (ss.totalReps ?? 0);
    }
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = dayKey(d);
      out.push({
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        seconds: totals[k] ?? 0,
      });
    }
    return out;
  }, [source, range.start, range.end]);

  const total = data.reduce((a, b) => a + b.seconds, 0);

  return (
    <GameCard className="p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2">
        <h3 className="font-bold">Hangboard · daily hold time</h3>
        <ChartRangeControls start={range.start} end={range.end} months={range.months} monthOffset={range.monthOffset} onEarlier={range.moveEarlier} onLater={range.moveLater} onMonthsChange={range.changeMonths} />
      </div>
      <div className="text-xs text-muted-foreground mb-2">{total}s total</div>
      <ChartMotion animationKey={range.animationKey} direction={range.direction} className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={Math.max(0, Math.floor(data.length / 8))} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
              formatter={(v: number) => [`${v}s`, "Hang seconds"]}
            />
            <Bar dataKey="seconds" fill="hsl(var(--btn-orange))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartMotion>
    </GameCard>
  );
}
