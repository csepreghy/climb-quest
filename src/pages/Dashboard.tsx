import { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { BadgeCard } from "@/components/BadgeCard";
import { useCharacterName } from "@/game/characterName";
import { StrengthTierChip, StrengthTierModal } from "@/components/StrengthTierStrip";
import { HangboardChart } from "@/components/hangboard/HangboardChart";
import { BoardChart } from "@/components/board/BoardChart";
import { useBoardSessions } from "@/game/board/store";
import { tierFor } from "@/game/strengthTier";
import { cn, formatChalk } from "@/lib/utils";

import { toast } from "sonner";
import { Plus, ArrowUp, Trophy, TrendingUp, ChevronRight, Dumbbell } from "lucide-react";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { LogModal } from "@/components/LogModal";
import { TrainingQuickPicker } from "@/components/TrainingQuickPicker";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { gradeToVRank, V_SCALE, gradeLabels, resolveGymGradingSystems, type GradingSystem } from "@/game/gyms";
import { usePublicGyms } from "@/game/publicGyms";

export default function Dashboard() {
  const s = useGame();
  useLevelOverrides();
  const { gyms } = useGyms();
  const cur = currentLevel(s);
  const next = nextLevel(s);
  const characterName = useCharacterName();
  const [logOpen, setLogOpen] = useState(false);
  const [logInitialMode, setLogInitialMode] = useState<"boulder" | "strength" | "board">("boulder");

  const [openBadgeId, setOpenBadgeId] = useState<string | null>(null);
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const openBadge = openBadgeId ? BADGES.find(b => b.id === openBadgeId) ?? null : null;
  const openBadgeHave = openBadge ? s.badges.includes(openBadge.id) : false;
  const strengthTierInfo = tierFor(s.strengthSessions ?? []);
  const { sessions: boardSessions } = useBoardSessions();
  const hangboardCount = (s.strengthSessions ?? []).filter((ss: any) => (ss.workout as string) === "hangboard").length;


  

  const onLevelUp = () => {
    window.dispatchEvent(new CustomEvent("cq:open-level-up-confirm"));
  };

  return (
    <div className="space-y-6 animate-float-up">
      <LogModal open={logOpen} onOpenChange={setLogOpen} initialMode={logInitialMode} />
      {/* Hero card + quick training picker */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-stretch">
      <GameCard tone="accent" className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
            <div className="flex items-start gap-4">
              <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
              <div className="sm:hidden">
                <EquippedStrip equipped={s.equipped} vertical />
              </div>
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              {characterName && (
                <div className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">{characterName}</div>
              )}
              <div className="menu-label flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <span>Level {s.level} · {cur.title}</span>
                <StrengthTierChip sessions={s.strengthSessions ?? []} onClick={() => setTierModalOpen(true)} />
              </div>
              <p className="text-muted-foreground mt-2 text-sm italic">"{cur.desc}"</p>


              <div className="hidden sm:block">
                <EquippedStrip equipped={s.equipped} />
              </div>

              {next && s.chalk >= next.cost && (
                <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <GameButton variant="primary" onClick={onLevelUp}>
                    <ArrowUp className="h-4 w-4" /> Level Up
                  </GameButton>
                </div>
              )}
            </div>
          </div>
        </GameCard>

        <TrainingQuickPicker
          className="lg:self-stretch"
          onPick={(mode) => { setLogInitialMode(mode); setLogOpen(true); }}
        />
      </div>


      {/* Stats */}
      <div className="grid gap-2 grid-cols-3 lg:grid-cols-8">
        <StatCard label="All-time chalk" value={formatChalk(s.totalChalkEarned)} />
        <StatCard label="Total logs" value={s.stats.totalLogs} />
        <StatCard label="Total sends" value={s.stats.totalSends} />
        <StatCard label="Total flashes" value={s.stats.totalFlashes} />
        <StatCard label="Bosses defeated" value={s.stats.bossesSent} />
        <StatCard label="Strength sessions" value={(s.strengthSessions ?? []).length} />
        <StatCard label="Board climbs" value={boardSessions.length} />
        <StatCard
          label="Best board"
          value={boardSessions.length
            ? boardSessions.reduce((a, b) => ((b.grade_rank ?? 0) > (a.grade_rank ?? 0) ? b : a)).grade
            : "—"}
        />
      </div>

      <ChalkOverTimeChart logs={s.logs} gyms={gyms} strengthSessions={s.strengthSessions ?? []} />

      <StrengthRepsHoldChart sessions={s.strengthSessions ?? []} />

      {boardSessions.length > 0 && <BoardChart />}

      {hangboardCount > 0 && <HangboardChart />}





      {/* All Badges */}
      <BadgesGrid badges={s.badges} ownedCount={s.owned.length} onOpen={(id) => setOpenBadgeId(id)} />

      {/* Badge details dialog */}
      <Dialog open={!!openBadgeId} onOpenChange={(v) => { if (!v) setOpenBadgeId(null); }}>
        <DialogContent className="max-w-sm">
          {openBadge && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-legendary/40 bg-[hsl(var(--panel-fill))]">
                    {openBadgeHave && openBadge.image ? (
                      <img src={openBadge.image} alt={openBadge.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl">❔</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-left">
                      {openBadgeHave ? openBadge.name : "Locked Badge"}
                    </DialogTitle>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                      {openBadgeHave ? "Unlocked" : "Locked"}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <DialogDescription className="text-sm text-foreground/80 whitespace-normal break-words">
                {openBadge.desc}
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>

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

      {boardSessions.length > 0 && (
        <GameCard className="p-5">
          <h3 className="menu-label mb-3">Recent Board Climbs</h3>
          <div className="divide-y divide-border/40">
            {boardSessions.slice(0, 6).map(b => {
              const where = b.board_type === "moonboard"
                ? (b.moonboard_variant ?? "MoonBoard").replace(/_/g, " ")
                : `Kilter ${b.kilter_angle ?? "?"}°`;
              return (
                <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {b.grade}
                      {b.is_flash && <span className="text-[10px] px-1.5 rounded bg-[hsl(var(--btn-orange))]/20 text-[hsl(var(--btn-orange))] font-bold uppercase">Flash</span>}
                      {b.is_benchmark && <span className="text-[10px] px-1.5 rounded bg-[hsl(var(--legendary))]/20 text-[hsl(var(--legendary))] font-bold uppercase">Benchmark</span>}
                      {b.problem_name && <span className="text-muted-foreground font-normal truncate">· {b.problem_name}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(b.logged_at).toLocaleDateString()} · {where}
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium tabular-nums">+{b.chalk_awarded}</div>
                </div>
              );
            })}
          </div>
        </GameCard>
      )}


      <StrengthTierModal
        open={tierModalOpen}
        onOpenChange={setTierModalOpen}
        tier={strengthTierInfo.tier}
        qualifiedDays={strengthTierInfo.qualifiedDays}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  const text = typeof value === "string" ? value : value.toLocaleString();
  return (
    <GameCard className="px-2 py-2.5 text-center">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground leading-tight line-clamp-2 min-h-[2em]">{label}</div>
      <div className="text-base sm:text-lg lg:text-xl font-bold mt-0.5 gradient-chalk-text tabular-nums leading-none">{text}</div>
    </GameCard>
  );
}

function EquippedStrip({ equipped, vertical }: { equipped: Partial<Record<Slot, string>>; vertical?: boolean }) {
  // Subscribe to catalog so strip re-renders once custom item images load on refresh.
  useCustomItems();
  const SLOTS: Slot[] = ["outfit", "bottoms", "shoes", "hat", "chalk", "hand", "accessory", "aura", "buddy", "study", "powerup"];
  const RARITY_RANK: Record<string, number> = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
  const equippedItems = SLOTS
    .map(slot => ({ slot, id: equipped[slot] }))
    .filter(e => !!e.id)
    .map(e => ({ slot: e.slot, item: getItem(e.id!) }))
    .filter(e => !!e.item)
    .sort((a, b) => (RARITY_RANK[b.item!.rarity] - RARITY_RANK[a.item!.rarity]))
    .slice(0, vertical ? 3 : 5);

  return (
    <div className={vertical ? "" : "mt-4"}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Equipped</div>
      {equippedItems.length === 0 ? (
        <Link to="/shop" className="block text-xs text-muted-foreground italic hover:text-foreground">
          Nothing equipped — visit the shop to gear up.
        </Link>
      ) : (
        <div className={cn(
          "flex gap-2",
          vertical ? "flex-col items-center" : "flex-wrap justify-center sm:justify-start"
        )}>
          {equippedItems.map(({ slot, item }, idx) => (
            <Link
              key={slot}
              to="/inventory"
              className={cn(
                "rounded-lg bg-background/50 grid place-items-center transition-transform hover:-translate-y-0.5",
                vertical ? "h-12 w-12" : "h-14 w-14",
                RARITY_BORDER[item!.rarity],
                !vertical && idx >= 3 && "hidden sm:grid",
                !vertical && idx >= 4 && "sm:hidden md:grid",
              )}
              title={item!.name}
            >
              {isImageEmoji(item!.emoji) ? (
                <SmartImage src={item!.emoji} alt={item!.name} loaderSize={20} className="h-full w-full object-contain p-1" />
              ) : (
                <span className={vertical ? "text-xl" : "text-2xl"}>{item!.emoji}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChalkOverTimeChart({ logs, gyms, strengthSessions }: { logs: { date: string; chalkTotal: number; grade?: string; gradeMax?: string; gymId?: string; isBoss?: boolean; attemptType?: string }[]; gyms: { id: string; gradingSystemIds: string[]; gradingSystems?: GradingSystem[] }[]; strengthSessions: StrengthSession[] }) {
  // Fall back to all known public gyms when a log's gym isn't in the passed list
  // (e.g. when viewing another climber's chart on the leaderboard).
  const pub = usePublicGyms();
  const findGym = (id: string) =>
    gyms.find(g => g.id === id) ?? pub.gyms.find(g => g.id === id);

  // Pick the grading system used most often in the last 30 days, based on which
  // logs' grade labels match each gym's available systems.
  const dominantGs = useMemo<GradingSystem | null>(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const counts = new Map<string, { gs: GradingSystem; n: number }>();
    for (const l of logs) {
      const t = new Date(l.date).getTime();
      if (t < cutoff) continue;
      if (l.isBoss && l.attemptType !== "send" && l.attemptType !== "flash") continue;
      const label = l.gradeMax || l.grade;
      if (!label) continue;
      const gym = l.gymId ? findGym(l.gymId) : null;
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
  }, [logs, gyms, pub.gyms]);

  const scaleLabels = useMemo(() => dominantGs ? gradeLabels(dominantGs) : [...V_SCALE], [dominantGs]);
  const axisTitle = dominantGs ? dominantGs.name : "V Scale";

  const data = useMemo(() => {
    const WEEKS = 13;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Anchor weeks to Monday of the current week.
    const dow = (today.getDay() + 6) % 7; // 0 = Monday
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - dow);

    type Wk = { ts: number; label: string; chalk: number; strength: number; gradeRank: number | null };
    const weeks: Wk[] = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const ws = new Date(thisWeekStart);
      ws.setDate(thisWeekStart.getDate() - i * 7);
      weeks.push({
        ts: ws.getTime(),
        label: ws.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        chalk: 0,
        strength: 0,
        gradeRank: null,
      });
    }
    const earliest = weeks[0].ts;
    const upperLabels = scaleLabels.map(l => l.toUpperCase());

    const weekIdxFor = (d: Date) => {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      const t = day.getTime();
      if (t < earliest) return -1;
      // Find latest week whose ts <= t.
      for (let i = weeks.length - 1; i >= 0; i--) {
        if (weeks[i].ts <= t) return i;
      }
      return -1;
    };

    for (const l of logs) {
      const idx = weekIdxFor(new Date(l.date));
      if (idx < 0) continue;
      weeks[idx].chalk += l.chalkTotal;
      const gLabel = l.gradeMax || l.grade;
      const countsForGrade = !l.isBoss || l.attemptType === "send" || l.attemptType === "flash";
      if (gLabel && countsForGrade) {
        let rank: number;
        const i = upperLabels.indexOf(gLabel.toUpperCase());
        if (i >= 0) rank = i;
        else if (!dominantGs || dominantGs.kind === "v" || dominantGs.kind === "french") {
          rank = gradeToVRank(gLabel, dominantGs ?? undefined);
        } else {
          rank = NaN;
        }
        if (!isNaN(rank) && (weeks[idx].gradeRank === null || rank > weeks[idx].gradeRank!)) {
          weeks[idx].gradeRank = rank;
        }
      }
    }
    for (const sess of strengthSessions) {
      const idx = weekIdxFor(new Date(sess.date));
      if (idx < 0) continue;
      weeks[idx].strength += sess.chalkTotal ?? 0;
    }

    return weeks;
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
              <Area yAxisId="chalk" type="monotone" dataKey="chalk" name="Climbing" stroke="hsl(var(--btn-orange))" strokeWidth={2} fill="url(#chalkGrad)" />
              <Area yAxisId="chalk" type="monotone" dataKey="strength" name="Strength" stroke="hsl(var(--sky))" strokeWidth={2} fill="url(#strengthGrad)" />
              <Line yAxisId="grade" type="monotone" dataKey="gradeRank" name="Top grade" stroke="hsl(270 80% 65%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(270 80% 65%)" }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </GameCard>
  );
}

/**
 * Daily strength reps (stacked bars by category) + hold seconds (line).
 * Reps: core, pull-up, push-up, squat, handstand push-up — counted regardless of level.
 * Hold seconds: plank + handstand hold, summed per day.
 */
export function StrengthRepsHoldChart({ sessions }: { sessions: StrengthSession[] }) {
  const isMobile = useIsMobile();
  const data = useMemo(() => {
    const DAYS = isMobile ? 14 : 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    type Row = { ts: number; key: string; label: string; core: number; pullup: number; pushup: number; squat: number; handstand_pushup: number; hold_sec: number; rollingAvg: number };
    const raw: Row[] = [];
    const byKey = new Map<string, Row>();
    
    // Generate DAYS + 6 trailing days to calculate rolling average for all visible days
    for (let i = DAYS - 1 + 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row: Row = { ts: d.getTime(), key, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), core: 0, pullup: 0, pushup: 0, squat: 0, handstand_pushup: 0, hold_sec: 0, rollingAvg: 0 };
      raw.push(row);
      byKey.set(key, row);
    }
    
    for (const sess of sessions) {
      const d = new Date(sess.date);
      d.setHours(0, 0, 0, 0);
      const row = byKey.get(d.toISOString().slice(0, 10));
      if (!row) continue;
      if (sess.workout === "plank") {
        for (const st of sess.sets) row.hold_sec += st.reps || 0;
      } else if (sess.workout === "handstand") {
        for (const st of sess.sets) {
          if (st.mode === "hold") row.hold_sec += st.reps || 0;
          else row.handstand_pushup += st.reps || 0;
        }
      } else if (sess.workout === "core") row.core += sess.totalReps;
      else if (sess.workout === "pullup") row.pullup += sess.totalReps;
      else if (sess.workout === "pushup") row.pushup += sess.totalReps;
      else if (sess.workout === "squat") row.squat += sess.totalReps;
    }

    const out: Row[] = [];
    for (let i = 6; i < raw.length; i++) {
      let sum = 0;
      for (let j = i - 6; j <= i; j++) {
        const r = raw[j];
        sum += (r.core + r.pullup + r.pushup + r.squat + r.handstand_pushup);
      }
      out.push({
        ...raw[i],
        rollingAvg: Math.round((sum / 7) * 10) / 10
      });
    }
    return out;
  }, [sessions, isMobile]);

  const hasAny = data.some(d => d.core || d.pullup || d.pushup || d.squat || d.handstand_pushup || d.hold_sec || d.rollingAvg);

  return (
    <GameCard className="p-5">
      <h3 className="menu-label mb-1 flex items-center gap-1.5">
        <Dumbbell className="h-3 w-3" /> Strength Reps & Holds · Daily & 7-day Avg
      </h3>
      <p className="text-[10px] text-muted-foreground mb-3 normal-case tracking-normal">
        Bars: total reps per category. Blue Line: 7-day rolling average of total reps. Pink Line: seconds held (plank + handstand hold).
      </p>
      {!hasAny ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          No strength sessions yet.
        </div>
      ) : (
        <div className="h-48 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(data.length / 10))} />
              <YAxis yAxisId="reps" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
              <YAxis yAxisId="sec" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(v: number, name: string) => {
                  if (name === "Hold") return [`${v}s`, name];
                  if (name === "7-day Avg") return [`${v} reps`, name];
                  return [`${v} reps`, name];
                }}
              />
              <Bar yAxisId="reps" dataKey="core" name="Core" stackId="r" fill="hsl(var(--btn-orange))" />
              <Bar yAxisId="reps" dataKey="pullup" name="Pull-up" stackId="r" fill="hsl(var(--sky))" opacity={0.7} />
              <Bar yAxisId="reps" dataKey="pushup" name="Push-up" stackId="r" fill="hsl(var(--btn-green))" opacity={0.7} />
              <Bar yAxisId="reps" dataKey="squat" name="Squat" stackId="r" fill="hsl(var(--btn-yellow, var(--btn-orange)))" opacity={0.7} />
              <Bar yAxisId="reps" dataKey="handstand_pushup" name="Handstand Pushup" stackId="r" fill="hsl(var(--primary))" opacity={0.7} radius={[3, 3, 0, 0]} />
              <Line yAxisId="reps" type="monotone" dataKey="rollingAvg" name="7-day Avg" stroke="hsl(var(--sky))" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="sec" type="monotone" dataKey="hold_sec" name="Hold" stroke="hsl(var(--boss))" strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </GameCard>
  );
}

function BadgesGrid({ badges, onOpen }: { badges: string[]; onOpen: (id: string) => void }) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const initial = isMobile ? 8 : 16;
  const list = expanded ? BADGES : BADGES.slice(0, initial);
  const hasMore = BADGES.length > initial;
  return (
    <GameCard tone="legendary" className="p-5">
      <h3 className="menu-label mb-3 flex items-center gap-1.5">
        <Trophy className="h-3 w-3" /> Badges ({badges.length}/{BADGES.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {list.map(b => {
          const have = badges.includes(b.id);
          return (
            <button
              type="button"
              key={b.id}
              onClick={() => onOpen(b.id)}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg border text-left transition hover:-translate-y-0.5",
                have ? "border-legendary/40 bg-legendary/5" : "border-border opacity-50"
              )}
            >
              <BadgeCard image={b.image} name={b.name} have={have} rarity={b.rarity} variant="shine" size="md" />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{have ? b.name : "Locked"}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-1">{b.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      {hasMore && (
        <div className="mt-3 flex justify-center">
          <GameButton variant="ghost" onClick={() => setExpanded(v => !v)}>
            {expanded ? "Show less" : `Show all (${BADGES.length})`}
          </GameButton>
        </div>
      )}
    </GameCard>
  );
}
