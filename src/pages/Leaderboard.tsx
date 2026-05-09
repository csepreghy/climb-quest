import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "@/components/ui/game-card";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAllItems, isImageEmoji } from "@/game/customItems";
import { RARITY_BORDER, Rarity, ShopItem, Gender } from "@/game/data";
import type { Equipped } from "@/game/store";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/utils";
import { Trophy, ScrollText, Swords } from "lucide-react";
import chalkBagImg from "@/assets/chalk-bag.png";

interface Row {
  user_id: string;
  character_name: string;
  level: number;
  total_chalk_earned: number;
  total_logs: number;
  bosses_sent: number;
  owned: string[];
  equipped: Equipped;
  gender: Gender;
}

const RARITY_ORDER: Record<Rarity, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };

function rarestItems(ownedIds: string[], lookup: Map<string, ShopItem>): ShopItem[] {
  const items = ownedIds.map(id => lookup.get(id)).filter(Boolean) as ShopItem[];
  return items
    .sort((a, b) => (RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]) || (b.price - a.price))
    .slice(0, 2);
}

const TROPHY_COLOR: Record<number, string> = {
  1: "text-legendary drop-shadow-[0_0_6px_hsl(var(--legendary)/0.6)]",
  2: "text-[hsl(0_0%_82%)] drop-shadow-[0_0_4px_hsl(0_0%_80%/0.5)]",
  3: "text-[hsl(28_70%_55%)] drop-shadow-[0_0_4px_hsl(28_70%_55%/0.5)]",
};

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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
              <RankRow key={row.user_id} row={row} rank={i + 1} lookup={lookup} />
            ))}
          </div>
        </GameCard>
      )}
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

function RankRow({ row, rank, lookup }: { row: Row; rank: number; lookup: Map<string, ShopItem> }) {
  const top = rarestItems(row.owned, lookup);
  return (
    <div className={cn(
      "flex items-center gap-3 sm:gap-4 py-3 px-2 rounded-md",
      rank === 1 && "bg-legendary/5",
    )}>
      <RankBadge rank={rank} />
      <ClimberAvatar level={row.level} gender={row.gender} equipped={row.equipped} size="sm" hideLevel />
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate">{row.character_name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>Lv {row.level}</span>
          <span className="opacity-50">·</span>
          <span className="flex items-center gap-1"><ScrollText className="h-3 w-3" />{row.total_logs}</span>
          <span className="opacity-50">·</span>
          <span className="flex items-center gap-1"><Swords className="h-3 w-3" />{row.bosses_sent}</span>
        </div>
      </div>
      <div className="hidden sm:flex gap-1.5">
        {top.map(item => (
          <div key={item.id} className={cn("h-9 w-9 rounded-md bg-background/40 grid place-items-center", RARITY_BORDER[item.rarity])} title={`${item.name} (${item.rarity})`}>
            {isImageEmoji(item.emoji) ? (
              <SmartImage src={item.emoji} alt={item.name} loaderSize={14} className="h-full w-full object-contain p-0.5" />
            ) : (
              <span className="text-base">{item.emoji}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0 min-w-[100px]">
        <div className="flex items-center gap-1.5">
          <img src={chalkBagImg} alt="" className="h-4 w-4" />
          <span className="text-sm font-bold tabular-nums gradient-chalk-text">{row.total_chalk_earned.toLocaleString()}</span>
        </div>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">All time</span>
      </div>
    </div>
  );
}
