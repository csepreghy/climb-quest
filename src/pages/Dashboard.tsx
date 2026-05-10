import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAllGyms as useGyms } from "@/game/allGyms";
import { useGame, currentLevel, nextLevel, levelUp, strengthLevelMult, type StrengthSession } from "@/game/store";
import { useLevelOverrides } from "@/game/levelOverrides";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { GameButton } from "@/components/ui/game-button";
import { GameCard, PixelBar } from "@/components/ui/game-card";
import { getItem, isImageEmoji, useCustomItems } from "@/game/customItems";
import { RARITY_BORDER, type Slot } from "@/game/data";
import { SmartImage } from "@/components/SmartImage";

import { BADGE_BY_ID, ACTIVITY_LABELS, BADGES } from "@/game/data";
import { useCharacterName } from "@/game/characterName";
import { cn } from "@/lib/utils";

import { toast } from "sonner";
import { Plus, ArrowUp, Trophy, TrendingUp, Backpack, ShoppingBag, ChevronRight, Dumbbell } from "lucide-react";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { LogModal } from "@/components/LogModal";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { gradeToVRank, V_SCALE, gradeLabels, resolveGymGradingSystems, type GradingSystem } from "@/game/gyms";

export default function Dashboard() {
  const s = useGame();
  useLevelOverrides();
  const { gyms } = useGyms();
  const cur = currentLevel(s);
  const next = nextLevel(s);
  const characterName = useCharacterName();
  const [logOpen, setLogOpen] = useState(false);

  

  const onLevelUp = () => {
    window.dispatchEvent(new CustomEvent("cq:open-level-up-confirm"));
  };

  return (
    <div className="space-y-6 animate-float-up">
      <LogModal open={logOpen} onOpenChange={setLogOpen} />
      {/* Hero card */}
      <GameCard tone="accent" className="p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            {characterName && (
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">{characterName}</div>
            )}
            <div className="menu-label">Level {s.level} · {cur.title}</div>
            <p className="text-muted-foreground mt-2 text-sm italic">"{cur.desc}"</p>

            <div className="mt-4 text-xs text-muted-foreground">
              {next ? <>Next: <span className="text-foreground font-medium">{next.title}</span></> : "Max level"}
            </div>

            <EquippedStrip equipped={s.equipped} />

            <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
              <GameButton variant="success" onClick={() => setLogOpen(true)}>
                <Plus className="h-4 w-4" /> Log Boulder
              </GameButton>
              {next && s.chalk >= next.cost && (
                <GameButton variant="primary" onClick={onLevelUp}>
                  <ArrowUp className="h-4 w-4" /> Level Up
                </GameButton>
              )}
              <Link to="/inventory">
                <GameButton variant="ghost"><Backpack className="h-4 w-4" /> Inventory</GameButton>
              </Link>
              <Link to="/shop">
                <GameButton variant="ghost"><ShoppingBag className="h-4 w-4" /> Shop</GameButton>
              </Link>
            </div>
          </div>
        </div>
      </GameCard>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="All-time chalk" value={s.totalChalkEarned} />
        <StatCard label="Total logs" value={s.stats.totalLogs} />
        <StatCard label="Total sends" value={s.stats.totalSends} />
        <StatCard label="Total flashes" value={s.stats.totalFlashes} />
        <StatCard label="Bosses defeated" value={s.stats.bossesSent} />
      </div>

      <ChalkOverTimeChart logs={s.logs} gyms={gyms} strengthSessions={s.strengthSessions ?? []} />

      <StrengthVolumeChart sessions={s.strengthSessions ?? []} />


      {/* All Badges */}
      <GameCard tone="legendary" className="p-5">
        <h3 className="menu-label mb-3 flex items-center gap-1.5">
          <Trophy className="h-3 w-3" /> Badges ({s.badges.length}/{BADGES.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {BADGES.map(b => {
            const have = s.badges.includes(b.id);
            return (
              <div key={b.id} className={cn("flex items-center gap-2 p-2.5 rounded-lg border", have ? "border-legendary/40 bg-legendary/5" : "border-border opacity-50")}>
                <div className="text-xl">{have ? b.emoji : "❔"}</div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{have ? b.name : "Locked"}</div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">{b.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </GameCard>

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
            {s.logs.slice(0, 6).map(l => {
              const hold = l.gymId && l.holdColorId
                ? gyms.find(g => g.id === l.gymId)?.holdColors.find(c => c.id === l.holdColorId)
                : null;
              return (
              <div key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  {hold && (
                    <span
                      title={`${hold.name} hold`}
                      aria-label={`${hold.name} hold`}
                      className="h-3 w-3 rounded-full border border-border shrink-0"
                      style={{ background: hold.hex2 ? `linear-gradient(90deg, ${hold.hex} 0 50%, ${hold.hex2} 50% 100%)` : hold.hex }}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{ACTIVITY_LABELS[l.activity] ?? "Boulder"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.date).toLocaleDateString()} · {l.styles.slice(0,2).join(", ") || "—"}{l.grade ? ` · ${l.grade}` : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium tabular-nums">+{l.chalkTotal}</div>
                  {l.chalkBonus > 0 && <div className="text-[10px] text-muted-foreground">+{l.chalkBonus} bonus</div>}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </GameCard>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <GameCard className="p-4 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1 gradient-chalk-text tabular-nums">{value.toLocaleString()}</div>
    </GameCard>
  );
}

function EquippedStrip({ equipped }: { equipped: Partial<Record<Slot, string>> }) {
  // Subscribe to catalog so strip re-renders once custom item images load on refresh.
  useCustomItems();
  const SLOTS: Slot[] = ["outfit", "bottoms", "shoes", "hat", "chalk", "hand", "accessory", "aura"];
  const equippedItems = SLOTS
    .map(slot => ({ slot, id: equipped[slot] }))
    .filter(e => !!e.id)
    .map(e => ({ slot: e.slot, item: getItem(e.id!) }))
    .filter(e => !!e.item)
    .slice(0, 4);

  return (
    <div className="mt-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Equipped</div>
      {equippedItems.length === 0 ? (
        <Link to="/shop" className="block text-xs text-muted-foreground italic hover:text-foreground">
          Nothing equipped — visit the shop to gear up.
        </Link>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {equippedItems.map(({ slot, item }) => (
            <Link
              key={slot}
              to="/inventory"
              className={cn(
                "h-14 w-14 rounded-lg bg-background/50 grid place-items-center transition-transform hover:-translate-y-0.5",
                RARITY_BORDER[item!.rarity],
              )}
              title={item!.name}
            >
              {isImageEmoji(item!.emoji) ? (
                <SmartImage src={item!.emoji} alt={item!.name} loaderSize={20} className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-2xl">{item!.emoji}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ChalkOverTimeChart({ logs, gyms, strengthSessions }: { logs: { date: string; chalkTotal: number; grade?: string; gradeMax?: string; gymId?: string }[]; gyms: { id: string; gradingSystemIds: string[]; gradingSystems?: GradingSystem[] }[]; strengthSessions: StrengthSession[] }) {
  // Pick the grading system used most often in the last 30 days, based on which
  // logs' grade labels match each gym's available systems.
  const dominantGs = useMemo<GradingSystem | null>(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const counts = new Map<string, { gs: GradingSystem; n: number }>();
    for (const l of logs) {
      const t = new Date(l.date).getTime();
      if (t < cutoff) continue;
      const label = l.gradeMax || l.grade;
      if (!label) continue;
      const gym = l.gymId ? gyms.find(g => g.id === l.gymId) : null;
      if (!gym) continue;
      const systems = resolveGymGradingSystems(gym);
      const upper = label.toUpperCase();
      const match = systems.find(gs => gradeLabels(gs).some(x => x.toUpperCase() === upper)) ?? systems[0];
      if (!match) continue;
      const cur = counts.get(match.id);
      if (cur) cur.n += 1; else counts.set(match.id, { gs: match, n: 1 });
    }
    let best: { gs: GradingSystem; n: number } | null = null;
    for (const v of counts.values()) if (!best || v.n > best.n) best = v;
    return best?.gs ?? null;
  }, [logs, gyms]);

  const scaleLabels = useMemo(() => dominantGs ? gradeLabels(dominantGs) : [...V_SCALE], [dominantGs]);
  const axisTitle = dominantGs ? dominantGs.name : "V Scale";

  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayIdx = (today.getDay() + 6) % 7;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - dayIdx);

    const WEEKS = 13; // ~3 months
    const buckets = new Map<string, { ts: number; chalk: number; strength: number; gradeRank: number | null }>();
    for (let i = WEEKS - 1; i >= 0; i--) {
      const m = new Date(currentMonday);
      m.setDate(currentMonday.getDate() - i * 7);
      buckets.set(m.toISOString().slice(0, 10), { ts: m.getTime(), chalk: 0, strength: 0, gradeRank: null });
    }
    const earliest = Array.from(buckets.values())[0]?.ts ?? 0;

    const upperLabels = scaleLabels.map(l => l.toUpperCase());

    for (const l of logs) {
      const d = new Date(l.date);
      const day = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day);
      monday.setHours(0, 0, 0, 0);
      if (monday.getTime() < earliest || monday.getTime() > currentMonday.getTime()) continue;
      const key = monday.toISOString().slice(0, 10);
      const existing = buckets.get(key);
      if (!existing) continue;
      existing.chalk += l.chalkTotal;
      const gLabel = l.gradeMax || l.grade;
      if (gLabel) {
        // Prefer exact index in dominant scale; fall back to V-rank approximation.
        let rank: number;
        const idx = upperLabels.indexOf(gLabel.toUpperCase());
        if (idx >= 0) rank = idx;
        else if (!dominantGs || dominantGs.kind === "v" || dominantGs.kind === "french") {
          rank = gradeToVRank(gLabel, dominantGs ?? undefined);
        } else {
          // Skip non-matching grades for number/color systems.
          rank = NaN;
        }
        if (!isNaN(rank) && (existing.gradeRank === null || rank > existing.gradeRank)) {
          existing.gradeRank = rank;
        }
      }
    }
    for (const sess of strengthSessions) {
      const d = new Date(sess.date);
      const day = (d.getDay() + 6) % 7;
      const monday = new Date(d);
      monday.setDate(d.getDate() - day);
      monday.setHours(0, 0, 0, 0);
      if (monday.getTime() < earliest || monday.getTime() > currentMonday.getTime()) continue;
      const key = monday.toISOString().slice(0, 10);
      const existing = buckets.get(key);
      if (!existing) continue;
      existing.strength += sess.chalkTotal ?? 0;
    }
    return Array.from(buckets.values())
      .sort((a, b) => a.ts - b.ts)
      .map(b => ({
        ...b,
        label: new Date(b.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      }));
  }, [logs, strengthSessions, scaleLabels, dominantGs]);

  return (
    <GameCard className="p-5">
      <h3 className="menu-label mb-3 flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3" /> Chalk &amp; Top Grade per Week
        <span className="ml-2 text-[10px] font-normal text-muted-foreground normal-case tracking-normal">({axisTitle})</span>
      </h3>
      {data.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No data yet. Log a session to start tracking your progress.
        </div>
      ) : (
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chalkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--btn-orange))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--btn-orange))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--sky))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--sky))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="chalk" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={36} />
              <YAxis
                yAxisId="grade"
                orientation="right"
                stroke="hsl(270 80% 65%)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={36}
                domain={[0, Math.max(1, scaleLabels.length - 1)]}
                allowDecimals={false}
                tickFormatter={(v: number) => scaleLabels[Math.round(v)] ?? ""}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(v: number, name: string) => {
                  if (name === "Top grade") return [v == null ? "—" : (scaleLabels[Math.round(v)] ?? String(v)), name];
                  return [`${v.toLocaleString()} chalk`, name];
                }}
              />
              <Area yAxisId="chalk" type="monotone" dataKey="chalk" stackId="chalk" name="Climbing" stroke="hsl(var(--btn-orange))" strokeWidth={2} fill="url(#chalkGrad)" />
              <Area yAxisId="chalk" type="monotone" dataKey="strength" stackId="chalk" name="Strength" stroke="hsl(var(--sky))" strokeWidth={2} fill="url(#strengthGrad)" />
              <Line yAxisId="grade" type="monotone" dataKey="gradeRank" name="Top grade" stroke="hsl(270 80% 65%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(270 80% 65%)" }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </GameCard>
  );
}

/**
 * Daily strength training "volume" chart.
 *
 * Reps alone aren't a fair comparison across difficulties (10 L1 reps ≠ 10 L5 reps).
 * We use **training volume** = Σ(reps × levelMultiplier) per session per day.
 * Boss-send sessions get a small +25% credit since they're max-effort single sets.
 * Bars are split by workout (core vs pull-up) so the user can see balance.
 */
function StrengthVolumeChart({ sessions }: { sessions: StrengthSession[] }) {
  const data = useMemo(() => {
    const DAYS = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets: { ts: number; key: string; core: number; pullup: number; pushup: number }[] = [];
    const byKey = new Map<string, { ts: number; key: string; core: number; pullup: number; pushup: number }>();
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = { ts: d.getTime(), key, core: 0, pullup: 0, pushup: 0 };
      buckets.push(row);
      byKey.set(key, row);
    }
    for (const sess of sessions) {
      const d = new Date(sess.date);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      const row = byKey.get(key);
      if (!row) continue;
      const mult = strengthLevelMult(sess.level);
      const bossBoost = sess.bossSend ? 1.25 : 1;
      const volume = Math.round(sess.totalReps * mult * bossBoost);
      if (sess.workout === "core") row.core += volume;
      else if (sess.workout === "pullup") row.pullup += volume;
      else if (sess.workout === "pushup") row.pushup += volume;
    }
    return buckets.map(b => ({
      ...b,
      label: new Date(b.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
  }, [sessions]);

  const hasAny = data.some(d => d.core > 0 || d.pullup > 0 || d.pushup > 0);

  return (
    <GameCard className="p-5">
      <h3 className="menu-label mb-1 flex items-center gap-1.5">
        <Dumbbell className="h-3 w-3" /> Strength Volume · Daily
      </h3>
      <p className="text-[10px] text-muted-foreground mb-3 normal-case tracking-normal">
        Volume = reps × level multiplier (L1 ×1 → L5 ×3). Harder sessions count more, so 5 L5 reps ≈ 15 L1 reps.
      </p>
      {!hasAny ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No strength sessions yet. Log a set to start tracking volume.
        </div>
      ) : (
        <div className="h-48 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(data.length / 10))} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(v: number, name: string) => [`${v} vol`, name]}
              />
              <Bar dataKey="core" name="Core" stackId="a" fill="hsl(var(--btn-orange))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pullup" name="Pull-up" stackId="a" fill="hsl(var(--sky))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="pushup" name="Push-up" stackId="a" fill="hsl(var(--btn-green))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </GameCard>
  );
}
