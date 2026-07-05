import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "@/components/ui/game-card";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAllItems, isImageEmoji } from "@/game/customItems";
import { RARITY_BORDER, Rarity, ShopItem, Gender, Slot } from "@/game/data";
import type { Equipped } from "@/game/store";
import type { StrengthSession } from "@/game/store";
import { SmartImage } from "@/components/SmartImage";
import { cn, formatChalk } from "@/lib/utils";
import { Trophy, ScrollText, Swords, Dumbbell, Sparkles, Mountain } from "lucide-react";
import chalkBagImg from "@/assets/chalk-bag.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChalkOverTimeChart, StrengthRepsHoldChart } from "@/pages/Dashboard";
import { ShopPreviewTile } from "@/components/pixel/ShopPreviewTile";
import { useAllGyms as useGyms } from "@/game/allGyms";
import { tierFor, TIER_LABEL, TIER_TEXT, tierChalkPct } from "@/game/strengthTier";

interface Row {
  user_id: string;
  character_name: string;
  level: number;
  total_chalk_earned: number;
  total_logs: number;
  bosses_sent: number;
  strength_reps: number;
  strength_seconds: number;
  board_sessions: number;
  owned: string[];
  equipped: Equipped;
  gender: Gender;
}

const RARITY_ORDER: Record<Rarity, number> = { mythic: 6, legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
const RARITY_TEXT: Record<Rarity, string> = {
  mythic: "text-mythic",
  legendary: "text-legendary",
  epic: "text-epic",
  rare: "text-rare",
  uncommon: "text-uncommon",
  common: "text-muted-foreground",
};

const SLOT_LABEL: Record<Slot, string> = {
  shoes: "Shoes",
  chalk: "Chalk",
  outfit: "Outfit",
  bottoms: "Bottoms",
  hat: "Hat",
  hand: "Hand",
  accessory: "Accessory",
  study: "Study",
  aura: "Aura",
  title: "Title",
  powerup: "Power-up",
  buddy: "Buddy",
  board: "Board",
};

const SLOT_ORDER: Slot[] = ["outfit", "bottoms", "shoes", "hat", "hand", "chalk", "accessory", "aura", "buddy", "title", "study", "powerup", "board"];

function rarestItems(ownedIds: string[], lookup: Map<string, ShopItem>, count = 5): ShopItem[] {
  const items = ownedIds.map(id => lookup.get(id)).filter(Boolean) as ShopItem[];
  return items
    .sort((a, b) => (RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]) || (b.price - a.price))
    .slice(0, count);
}

const TROPHY_COLOR: Record<number, string> = {
  1: "text-legendary drop-shadow-[0_0_6px_hsl(var(--legendary)/0.6)]",
  2: "text-[hsl(0_0%_82%)] drop-shadow-[0_0_4px_hsl(0_0%_80%/0.5)]",
  3: "text-[hsl(28_70%_55%)] drop-shadow-[0_0_4px_hsl(28_70%_55%/0.5)]",
};

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ row: Row; rank: number } | null>(null);
  const allItems = useAllItems();
  const lookup = new Map(allItems.map(i => [i.id, i]));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_leaderboard");
      if (cancelled) return;
      if (error) { setError(error.message); return; }
      setRows((data ?? []) as any as Row[]);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-legendary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Climbers ranked by all-time Chalk earned.</p>
        </div>
      </div>

      {error && (
        <GameCard className="p-4 text-sm text-destructive">{error}</GameCard>
      )}
      {!rows && !error && (
        <GameCard className="p-8 text-center text-sm text-muted-foreground">Loading…</GameCard>
      )}
      {rows && rows.length === 0 && (
        <GameCard className="p-8 text-center text-sm text-muted-foreground">
          No climbers yet. Be the first!
        </GameCard>
      )}

      {rows && rows.length > 0 && (
        <GameCard className="p-2 sm:p-3">
          <div className="divide-y divide-border/40">
            {rows.map((row, i) => (
              <RankRow
                key={row.user_id}
                row={row}
                rank={i + 1}
                lookup={lookup}
                onSelect={() => setSelected({ row, rank: i + 1 })}
              />
            ))}
          </div>
        </GameCard>
      )}

      <ClimberDetailsDialog
        open={!!selected}
        onOpenChange={(v) => { if (!v) setSelected(null); }}
        row={selected?.row ?? null}
        rank={selected?.rank ?? 0}
        lookup={lookup}
      />
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return (
      <div className="w-10 shrink-0 flex flex-col items-center">
        <Trophy className={cn("h-6 w-6", TROPHY_COLOR[rank])} fill="currentColor" />
        <div className="text-[10px] font-bold tabular-nums text-muted-foreground mt-0.5">#{rank}</div>
      </div>
    );
  }
  return (
    <div className="w-10 shrink-0 text-center text-sm font-bold text-muted-foreground tabular-nums">#{rank}</div>
  );
}

function RankRow({ row, rank, lookup, onSelect }: { row: Row; rank: number; lookup: Map<string, ShopItem>; onSelect: () => void }) {
  const equippedIds = SLOT_ORDER.map(s => row.equipped[s]).filter(Boolean) as string[];
  const top = rarestItems(equippedIds, lookup, 5);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-2 sm:gap-4 py-3 px-1.5 sm:px-2 rounded-md text-left transition hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        rank === 1 && "bg-legendary/5",
      )}
    >
      <RankBadge rank={rank} />
      <ClimberAvatar level={row.level} gender={row.gender} equipped={row.equipped} size="sm" hideLevel />
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate text-sm sm:text-base">{row.character_name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-x-1.5 gap-y-0.5 flex-wrap mt-0.5">
          <span className="font-medium">Lv {row.level}</span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-0.5"><ScrollText className="h-3 w-3" />{row.total_logs}</span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-0.5"><Swords className="h-3 w-3" />{row.bosses_sent}</span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-0.5" title="Strength reps"><Dumbbell className="h-3 w-3" />{row.strength_reps ?? 0}</span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-0.5 tabular-nums" title="Total hold time">⏱ {formatDuration(row.strength_seconds ?? 0)}</span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-0.5"><Mountain className="h-3 w-3" />{row.board_sessions ?? 0}</span>
        </div>
      </div>
      <div className="hidden sm:flex gap-1.5">
        {top.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              "h-9 w-9 rounded-md bg-background/40 grid place-items-center",
              RARITY_BORDER[item.rarity],
              // 2 on sm, 3 on md, 5 on lg+
              idx >= 2 && "hidden md:grid",
              idx >= 3 && "md:hidden lg:grid",
            )}
            title={`${item.name} (${item.rarity})`}
          >
            {isImageEmoji(item.emoji) ? (
              <SmartImage src={item.emoji} alt={item.name} loaderSize={14} className="h-full w-full object-contain p-0.5" />
            ) : (
              <span className="text-base">{item.emoji}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0 sm:min-w-[100px]">
        <div className="flex items-center gap-1">
          <img src={chalkBagImg} alt="" className="h-4 w-4" />
          <span className="text-sm font-bold tabular-nums gradient-chalk-text">{formatChalk(row.total_chalk_earned)}</span>
        </div>
        <span className="hidden sm:inline text-[9px] uppercase tracking-wider text-muted-foreground">All time</span>
      </div>
    </button>
  );
}

const WORKOUT_ORDER = ["pullup", "pushup", "squat", "handstand", "plank", "core"] as const;
const WORKOUT_LABEL: Record<string, string> = {
  pullup: "Pull-ups",
  pushup: "Push-ups",
  squat: "Squats",
  handstand: "Handstand",
  plank: "Plank",
  core: "Core",
};

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function StrengthStatCard({ label, value }: { label: string; value: number | string }) {
  const text = typeof value === "string" ? value : value.toLocaleString();
  return (
    <GameCard className="px-2 py-2.5 text-center">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground leading-tight line-clamp-2 min-h-[2em]">{label}</div>
      <div className="text-base sm:text-lg font-bold mt-0.5 gradient-chalk-text tabular-nums leading-none">{text}</div>
    </GameCard>
  );
}

function ClimberDetailsDialog({
  open, onOpenChange, row, rank, lookup,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: Row | null;
  rank: number;
  lookup: Map<string, ShopItem>;
}) {
  const { gyms } = useGyms();
  const [charts, setCharts] = useState<{ logs: any[]; strengthSessions: StrengthSession[]; boardSessions: any[] } | null>(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [chartsError, setChartsError] = useState<string | null>(null);

  const strengthStats = useMemo(() => {
    const sessions = charts?.strengthSessions ?? [];
    const repsByWorkout: Record<string, number> = {};
    const holdsByWorkout: Record<string, number> = {};
    let totalReps = 0;
    let totalHoldSeconds = 0;
    for (const ss of sessions) {
      for (const st of ss.sets) {
        if (st.mode === "hold") {
          const sec = st.reps || 0;
          holdsByWorkout[ss.workout] = (holdsByWorkout[ss.workout] || 0) + sec;
          totalHoldSeconds += sec;
        } else {
          const r = st.reps || 0;
          repsByWorkout[ss.workout] = (repsByWorkout[ss.workout] || 0) + r;
          totalReps += r;
        }
      }
    }
    return { repsByWorkout, holdsByWorkout, totalReps, totalHoldSeconds, sessions };
  }, [charts]);

  useEffect(() => {
    if (!open || !row) { setCharts(null); setChartsError(null); return; }
    let cancelled = false;
    setChartsLoading(true);
    setChartsError(null);
    setCharts(null);
    (async () => {
      const { data, error } = await supabase.rpc("get_climber_charts", { target_user: row.user_id });
      if (cancelled) return;
      setChartsLoading(false);
      if (error) { setChartsError(error.message); return; }
      const r = (data as any)?.[0];
      setCharts({
        logs: (r?.logs ?? []) as any[],
        strengthSessions: (r?.strength_sessions ?? []) as StrengthSession[],
        boardSessions: (r?.board_sessions ?? []) as any[],
      });
    })();
    return () => { cancelled = true; };
  }, [open, row]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {row && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {rank <= 3 && <Trophy className={cn("h-5 w-5", TROPHY_COLOR[rank])} fill="currentColor" />}
                <span className="truncate">{row.character_name}</span>
                <span className="text-xs font-normal text-muted-foreground">#{rank}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-4">
              <ClimberAvatar level={row.level} gender={row.gender} equipped={row.equipped} size="lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5">
                  <img src={chalkBagImg} alt="" className="h-4 w-4" />
                  <span className="text-base font-bold tabular-nums gradient-chalk-text">
                    {formatChalk(row.total_chalk_earned)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">all-time</span>
                </div>
                <div className="text-xs text-muted-foreground">Level {row.level}</div>
                <div className="text-xs text-muted-foreground">
                  {row.owned?.length ?? 0} item{(row.owned?.length ?? 0) === 1 ? "" : "s"} owned
                </div>
              </div>
            </div>

            <div className="grid gap-2 grid-cols-3 sm:grid-cols-6">
              <StrengthStatCard label="Logs" value={row.total_logs} />
              <StrengthStatCard label="Bosses" value={row.bosses_sent} />
              <StrengthStatCard label="Reps" value={row.strength_reps ?? 0} />
              <StrengthStatCard label="Hold time" value={formatDuration(row.strength_seconds ?? 0)} />
              <StrengthStatCard label="Board" value={chartsLoading ? "—" : (charts?.boardSessions ?? []).length} />
              <StrengthStatCard label="Tier" value={(() => {
                if (!charts?.strengthSessions) return "—";
                const { tier } = tierFor(charts.strengthSessions);
                return TIER_LABEL[tier];
              })()} />
            </div>

            {strengthStats.sessions.length > 0 && (
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {strengthStats.totalReps > 0 && (
                  <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
                    <div className="text-base font-bold tabular-nums leading-none">{strengthStats.totalReps.toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Dumbbell className="h-3 w-3" /> Total reps
                    </div>
                  </div>
                )}
                {strengthStats.totalHoldSeconds > 0 && (
                  <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
                    <div className="text-base font-bold tabular-nums leading-none">{formatDuration(strengthStats.totalHoldSeconds)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Total hold time</div>
                  </div>
                )}
                {WORKOUT_ORDER.map(w => {
                  const reps = strengthStats.repsByWorkout[w];
                  if (reps) return (
                    <div key={`${w}-reps`} className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
                      <div className="text-base font-bold tabular-nums leading-none">{reps.toLocaleString()}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{WORKOUT_LABEL[w]}</div>
                    </div>
                  );
                  return null;
                })}
                {WORKOUT_ORDER.map(w => {
                  const holds = strengthStats.holdsByWorkout[w];
                  if (holds) return (
                    <div key={`${w}-holds`} className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
                      <div className="text-base font-bold tabular-nums leading-none">{formatDuration(holds)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{WORKOUT_LABEL[w]} holds</div>
                    </div>
                  );
                  return null;
                })}
              </div>
            )}

            {chartsLoading && (
              <div className="text-xs text-muted-foreground py-4 text-center">Loading charts…</div>
            )}
            {chartsError && (
              <div className="text-xs text-destructive py-2 text-center">{chartsError}</div>
            )}
            {charts && (
              <div className="space-y-3">
                <ChalkOverTimeChart logs={charts.logs as any} gyms={gyms} strengthSessions={charts.strengthSessions} />
                <StrengthRepsHoldChart sessions={charts.strengthSessions} />
              </div>
            )}

            <div>
              <div className="menu-label mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Equipped
              </div>
              <EquippedList equipped={row.equipped} lookup={lookup} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  const text = typeof value === "string" ? value : value.toLocaleString();
  return (
    <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
      <div className="text-base font-bold tabular-nums leading-none">{text}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center justify-center gap-1">
        {icon} {label}
      </div>
    </div>
  );
}

function BoardBestTile({ sessions }: { sessions: any[] | null }) {
  const best = sessions && sessions.length
    ? sessions.reduce((a: any, b: any) => ((b.grade_rank ?? 0) > (a.grade_rank ?? 0) ? b : a))
    : null;
  return (
    <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
      <div className="text-base font-bold leading-none">{best ? best.grade : "—"}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <Mountain className="h-3 w-3" /> Best board
      </div>
    </div>
  );
}

function StrengthTierTile({ sessions }: { sessions: StrengthSession[] | null }) {
  if (!sessions) {
    return (
      <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
        <div className="text-base font-bold tabular-nums leading-none text-muted-foreground">—</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Tier</div>
      </div>
    );
  }
  const { tier, qualifiedDays } = tierFor(sessions);
  const pct = tierChalkPct(tier);
  return (
    <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
      <div className={cn("text-base font-bold leading-none", TIER_TEXT[tier])}>
        {TIER_LABEL[tier]}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <Dumbbell className="h-3 w-3" /> {qualifiedDays} of 7 days{pct > 0 ? ` · +${pct}%` : ""}
      </div>
    </div>
  );
}

function EquippedList({ equipped, lookup }: { equipped: Equipped; lookup: Map<string, ShopItem> }) {
  const entries = SLOT_ORDER
    .map(slot => ({ slot, item: equipped[slot] ? lookup.get(equipped[slot]!) : undefined }))
    .filter(e => !!e.item) as { slot: Slot; item: ShopItem }[];

  if (entries.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic px-1 py-4 text-center border-2 border-dashed border-border rounded-lg">
        Nothing equipped.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {entries.map(({ slot, item }) => (
        <ShopPreviewTile
          key={slot}
          item={item}
          hidePrice
          footer={
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wider text-white/70 font-semibold leading-none">
                {SLOT_LABEL[slot]}
              </span>
              <span className="text-[11px] font-bold leading-tight line-clamp-1 text-white">
                {item.name}
              </span>
            </div>
          }
        />
      ))}
    </div>
  );
}
