import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "@/components/ui/game-card";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAllItems, isImageEmoji } from "@/game/customItems";
import { RARITY_BORDER, Rarity, ShopItem, Gender, Slot } from "@/game/data";
import type { Equipped } from "@/game/store";
import type { StrengthSession } from "@/game/store";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/utils";
import { Trophy, ScrollText, Swords, Dumbbell, Sparkles } from "lucide-react";
import chalkBagImg from "@/assets/chalk-bag.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChalkOverTimeChart, StrengthVolumeChart } from "@/pages/Dashboard";
import { useAllGyms as useGyms } from "@/game/allGyms";

interface Row {
  user_id: string;
  character_name: string;
  level: number;
  total_chalk_earned: number;
  total_logs: number;
  bosses_sent: number;
  strength_sessions: number;
  owned: string[];
  equipped: Equipped;
  gender: Gender;
}

const RARITY_ORDER: Record<Rarity, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
const RARITY_TEXT: Record<Rarity, string> = {
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
};

const SLOT_ORDER: Slot[] = ["outfit", "bottoms", "shoes", "hat", "hand", "chalk", "accessory", "aura", "buddy", "title", "study", "powerup"];

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
          <span className="flex items-center gap-0.5"><Dumbbell className="h-3 w-3" />{row.strength_sessions ?? 0}</span>
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
          <span className="text-sm font-bold tabular-nums gradient-chalk-text">{row.total_chalk_earned.toLocaleString()}</span>
        </div>
        <span className="hidden sm:inline text-[9px] uppercase tracking-wider text-muted-foreground">All time</span>
      </div>
    </button>
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
                    {row.total_chalk_earned.toLocaleString()}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">all-time</span>
                </div>
                <div className="text-xs text-muted-foreground">Level {row.level}</div>
                <div className="text-xs text-muted-foreground">
                  {row.owned?.length ?? 0} item{(row.owned?.length ?? 0) === 1 ? "" : "s"} owned
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatTile icon={<ScrollText className="h-3.5 w-3.5" />} label="Logs" value={row.total_logs} />
              <StatTile icon={<Swords className="h-3.5 w-3.5" />} label="Bosses" value={row.bosses_sent} />
              <StatTile icon={<Dumbbell className="h-3.5 w-3.5" />} label="Strength" value={row.strength_sessions ?? 0} />
            </div>

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

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2 text-center">
      <div className="text-base font-bold tabular-nums leading-none">{value.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 flex items-center justify-center gap-1">
        {icon} {label}
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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {entries.map(({ slot, item }) => (
        <div
          key={slot}
          className={cn(
            "relative flex flex-col items-center rounded-lg border-2 bg-background/40 p-2 text-center overflow-hidden",
            RARITY_BORDER[item.rarity],
          )}
          title={`${item.name} · ${item.rarity}`}
        >
          <div className="absolute top-1 left-1 text-[8px] uppercase tracking-wider px-1 py-0.5 rounded bg-background/70 text-muted-foreground font-semibold">
            {SLOT_LABEL[slot]}
          </div>
          <div className="h-14 w-14 mt-3 mb-1.5 rounded-md bg-background/60 grid place-items-center overflow-hidden">
            {isImageEmoji(item.emoji) ? (
              <SmartImage src={item.emoji} alt={item.name} loaderSize={18} className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-2xl">{item.emoji}</span>
            )}
          </div>
          <div className="text-[11px] font-semibold leading-tight line-clamp-2 w-full">{item.name}</div>
          <div className={cn("text-[9px] uppercase tracking-wider mt-0.5 font-bold", RARITY_TEXT[item.rarity])}>
            {item.rarity}
          </div>
        </div>
      ))}
    </div>
  );
}
