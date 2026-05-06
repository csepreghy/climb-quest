import { useMemo } from "react";
import { useGame, currentLevel, nextLevel, levelUp, activeBoss } from "@/game/store";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { GameButton } from "@/components/ui/game-button";
import { GameCard, PixelBar } from "@/components/ui/game-card";
import { Link, useNavigate } from "react-router-dom";
import { ITEM_BY_ID, BADGE_BY_ID, ACTIVITY_LABELS } from "@/game/data";
import { toast } from "sonner";
import { ScrollText, Swords, ArrowUp, Sparkles, Trophy, TrendingUp } from "lucide-react";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Dashboard() {
  const s = useGame();
  const cur = currentLevel(s);
  const next = nextLevel(s);
  const boss = activeBoss(s);
  const nav = useNavigate();
  const titleId = s.equipped.title;
  const titleName = titleId ? ITEM_BY_ID[titleId]?.name.replace(/^Title:\s*/, "") : cur.title;
  const progress = next ? Math.min(100, Math.round((s.chalk / next.cost) * 100)) : 100;

  const onLevelUp = () => {
    const r = levelUp();
    if (!r.ok) { toast.error(r.reason ?? "Cannot level up"); return; }
    showLevelUpBanner(nextLevel(s)?.title ?? cur.title, r.unlocks ?? []);
  };

  return (
    <div className="space-y-6 animate-float-up">
      {/* Hero card */}
      <GameCard tone="accent" className="p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="menu-label">Level {s.level} · {cur.title}</div>
            <h1 className="font-display font-semibold text-2xl sm:text-3xl mt-1.5 leading-tight">{titleName}</h1>
            <p className="text-muted-foreground mt-2 text-sm italic">"{cur.desc}"</p>

            <div className="mt-5 space-y-1.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">
                  {next ? <>Next: <span className="text-foreground font-medium">{next.title}</span></> : "Max level"}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {next ? <><span className="text-foreground font-medium">{s.chalk.toLocaleString()}</span> / {next.cost.toLocaleString()}</> : `${s.chalk.toLocaleString()}`}
                </span>
              </div>
              <PixelBar value={progress} max={100} color="hsl(var(--accent))" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
              <GameButton variant="success" onClick={() => nav("/log")}>
                <ScrollText className="h-4 w-4" /> Log Boulder
              </GameButton>
              <GameButton variant="danger" onClick={() => nav("/bosses")}>
                <Swords className="h-4 w-4" /> Boss Project
              </GameButton>
              {next && s.chalk >= next.cost && (
                <GameButton variant="legendary" onClick={onLevelUp}>
                  <ArrowUp className="h-4 w-4" /> Level Up
                </GameButton>
              )}
            </div>
          </div>
        </div>
      </GameCard>

      <ChalkOverTimeChart logs={s.logs} />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Equipped */}
        <GameCard className="p-5">
          <h3 className="menu-label mb-3 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Equipped</h3>
          <div className="space-y-1 text-sm">
            {(["shoes","chalk","outfit","bottoms","accessory","aura","title"] as const).map(slot => {
              const id = s.equipped[slot];
              const it = id ? ITEM_BY_ID[id] : null;
              return (
                <div key={slot} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-muted-foreground capitalize text-xs">{slot}</span>
                  <span className="flex items-center gap-1.5 text-sm">
                    {it ? <>{it.emoji} <span className="truncate">{it.name}</span></> : <span className="text-muted-foreground/70 italic text-xs">empty</span>}
                  </span>
                </div>
              );
            })}
          </div>
          {s.pendingConsumable && (
            <div className="mt-3 text-xs px-2.5 py-1.5 rounded-md bg-chalk-glow/10 border border-chalk-glow/30 text-chalk-glow">
              Next log boosted: {ITEM_BY_ID[s.pendingConsumable]?.name}
            </div>
          )}
        </GameCard>

        {/* Active boss */}
        <GameCard tone="boss" className="p-5">
          <h3 className="menu-label mb-3 flex items-center gap-1.5"><Swords className="h-3 w-3" /> Active Boss</h3>
          {boss ? (
            <Link to="/bosses" className="block group">
              <div className="font-medium truncate group-hover:text-boss transition-colors">{boss.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{boss.grade} · {boss.style}</div>
              <div className="mt-3">
                <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                  <span>High point</span><span className="tabular-nums">{boss.highPoint}%</span>
                </div>
                <PixelBar value={boss.highPoint} color="hsl(var(--boss))" />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">{boss.attempts.length} attempts</div>
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground">No active boss. Pick a nemesis →</div>
          )}
        </GameCard>

        {/* Badges */}
        <GameCard tone="legendary" className="p-5">
          <h3 className="menu-label mb-3 flex items-center gap-1.5"><Trophy className="h-3 w-3" /> Badges</h3>
          {s.badges.length === 0 ? (
            <div className="text-sm text-muted-foreground">No badges yet. Log something — anything!</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {s.badges.slice(0, 12).map(id => {
                const b = BADGE_BY_ID[id]; if (!b) return null;
                return (
                  <div key={id} title={b.desc} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary/60 border border-border">
                    <span>{b.emoji}</span><span>{b.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GameCard>
      </div>

      {/* Recent logs */}
      <GameCard className="p-5">
        <h3 className="menu-label mb-3">Recent Logs</h3>
        {s.logs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            <p className="text-2xl mb-2">🪨</p>
            No logs yet. Send something — even a humbling slab counts.
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {s.logs.slice(0, 6).map(l => (
              <div key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{ACTIVITY_LABELS[l.activity] ?? "Boulder"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.date).toLocaleDateString()} · {l.styles.slice(0,2).join(", ") || "—"}{l.grade ? ` · ${l.grade}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium tabular-nums">+{l.chalkTotal}</div>
                  {l.chalkBonus > 0 && <div className="text-[10px] text-muted-foreground">+{l.chalkBonus} bonus</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </GameCard>
    </div>
  );
}

function ChalkOverTimeChart({ logs }: { logs: { date: string; chalkTotal: number }[] }) {
  const data = useMemo(() => {
    if (logs.length === 0) return [];
    const buckets = new Map<string, { week: string; ts: number; chalk: number }>();
    for (const l of logs) {
      const d = new Date(l.date);
      // Week start (Monday)
      const day = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day);
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);
      const existing = buckets.get(key);
      if (existing) existing.chalk += l.chalkTotal;
      else buckets.set(key, { week: key, ts: monday.getTime(), chalk: l.chalkTotal });
    }
    return Array.from(buckets.values())
      .sort((a, b) => a.ts - b.ts)
      .map(b => ({
        ...b,
        label: new Date(b.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      }));
  }, [logs]);

  return (
    <GameCard className="p-5">
      <h3 className="menu-label mb-3 flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3" /> Chalk per Week
      </h3>
      {data.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No data yet. Log a session to start tracking your progress.
        </div>
      ) : (
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chalkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(v: number) => [`${v.toLocaleString()} chalk`, "Earned"]}
              />
              <Area type="monotone" dataKey="chalk" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#chalkGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </GameCard>
  );
}
