import { useMemo } from "react";
import { GameCard } from "@/components/ui/game-card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useGame } from "@/game/store";

/**
 * Daily hangboard hang-seconds for the trailing 14 days.
 * Reads from strengthSessions where workout === "hangboard".
 */
export function HangboardChart() {
  const s = useGame();
  const data = useMemo(() => {
    const out: { day: string; seconds: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayKey = (d: Date) => d.toDateString();
    const totals: Record<string, number> = {};
    for (const ss of s.strengthSessions ?? []) {
      if ((ss.workout as string) !== "hangboard") continue;
      const k = dayKey(new Date(ss.date));
      totals[k] = (totals[k] ?? 0) + (ss.totalReps ?? 0);
    }
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const k = dayKey(d);
      out.push({
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        seconds: totals[k] ?? 0,
      });
    }
    return out;
  }, [s.strengthSessions]);

  const total = data.reduce((a, b) => a + b.seconds, 0);

  return (
    <GameCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold">Hangboard · last 14 days</h3>
        <span className="text-xs text-muted-foreground">{total}s total</span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={1} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
              formatter={(v: number) => [`${v}s`, "Hang seconds"]}
            />
            <Bar dataKey="seconds" fill="hsl(var(--btn-orange))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GameCard>
  );
}
