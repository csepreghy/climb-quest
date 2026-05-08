import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "@/components/ui/game-card";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAllItems, isImageEmoji } from "@/game/customItems";
import { RARITY_BORDER, Rarity, ShopItem, Gender, Equipped } from "@/game/data";
import { SmartImage } from "@/components/SmartImage";
import { cn } from "@/lib/utils";
import { Trophy, Crown, Medal, Award, ScrollText, Skull } from "lucide-react";
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

const RARITY_ORDER: Record<Rarity, number> = { legendary: 4, epic: 3, rare: 2, common: 1 };

function rarestItems(ownedIds: string[], lookup: Map<string, ShopItem>): ShopItem[] {
  const items = ownedIds.map(id => lookup.get(id)).filter(Boolean) as ShopItem[];
  return items
    .sort((a, b) => (RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]) || (b.price - a.price))
    .slice(0, 2);
}

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
          No named climbers yet. Be the first!
        </GameCard>
      )}

      {rows && rows.length > 0 && (
        <>
          {/* Podium for top 3 */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 0, 2].map(podiumIdx => {
              const row = rows[podiumIdx];
              if (!row) return <div key={podiumIdx} />;
              return <PodiumCard key={row.user_id} row={row} rank={podiumIdx + 1} lookup={lookup} className={podiumIdx === 0 ? "sm:order-2" : podiumIdx === 1 ? "sm:order-1" : "sm:order-3"} />;
            })}
          </div>

          {/* Rest */}
          {rows.length > 3 && (
            <GameCard className="p-3 sm:p-4">
              <div className="divide-y divide-border/40">
                {rows.slice(3).map((row, i) => (
                  <RankRow key={row.user_id} row={row} rank={i + 4} lookup={lookup} />
                ))}
              </div>
            </GameCard>
          )}
        </>
      )}
    </div>
  );
}

function PodiumCard({ row, rank, lookup, className }: { row: Row; rank: number; lookup: Map<string, ShopItem>; className?: string }) {
  const top = rarestItems(row.owned, lookup);
  const colors = {
    1: { ring: "ring-legendary shadow-[0_0_40px_hsl(var(--legendary)/0.4)]", bg: "from-legendary/20 to-transparent", icon: Crown, iconColor: "text-legendary", label: "1st" },
    2: { ring: "ring-[hsl(0_0%_75%)]/80", bg: "from-[hsl(0_0%_75%)]/15 to-transparent", icon: Medal, iconColor: "text-[hsl(0_0%_85%)]", label: "2nd" },
    3: { ring: "ring-[hsl(28_60%_55%)]/80", bg: "from-[hsl(28_60%_55%)]/15 to-transparent", icon: Award, iconColor: "text-[hsl(28_70%_60%)]", label: "3rd" },
  }[rank as 1 | 2 | 3]!;
  const Icon = colors.icon;
  const heightClass = rank === 1 ? "sm:pt-0" : "sm:pt-8";
  return (
    <GameCard tone={rank === 1 ? "legendary" : rank === 2 ? "accent" : undefined} className={cn("relative p-5 text-center bg-gradient-to-b", colors.bg, heightClass, className)}>
      <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider bg-background border-2 border-[hsl(var(--panel-frame))] flex items-center gap-1.5", colors.iconColor)}>
        <Icon className="h-4 w-4" /> {colors.label}
      </div>
      <div className={cn("inline-flex rounded-2xl ring-4 ring-offset-2 ring-offset-background", colors.ring)}>
        <ClimberAvatar level={row.level} gender={row.gender} equipped={row.equipped} size={rank === 1 ? "xl" : "lg"} glow={rank === 1} />
      </div>
      <div className="mt-3 text-lg font-bold truncate">{row.character_name}</div>
      <div className="text-xs text-muted-foreground">Lv {row.level}</div>
      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/40 border border-border">
        <img src={chalkBagImg} alt="" className="h-4 w-4" />
        <span className="font-bold tabular-nums gradient-chalk-text">{row.total_chalk_earned.toLocaleString()}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div className="flex items-center justify-center gap-1"><ScrollText className="h-3 w-3" />{row.total_logs} logs</div>
        <div className="flex items-center justify-center gap-1"><Skull className="h-3 w-3" />{row.bosses_sent} bosses</div>
      </div>
      {top.length > 0 && (
        <div className="mt-3 flex justify-center gap-2">
          {top.map(item => (
            <div key={item.id} className={cn("h-12 w-12 rounded-lg bg-background/50 grid place-items-center", RARITY_BORDER[item.rarity])} title={`${item.name} (${item.rarity})`}>
              {isImageEmoji(item.emoji) ? (
                <SmartImage src={item.emoji} alt={item.name} loaderSize={18} className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-xl">{item.emoji}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </GameCard>
  );
}

function RankRow({ row, rank, lookup }: { row: Row; rank: number; lookup: Map<string, ShopItem> }) {
  const top = rarestItems(row.owned, lookup);
  return (
    <div className="flex items-center gap-3 sm:gap-4 py-3">
      <div className="w-8 text-center text-sm font-bold text-muted-foreground tabular-nums">#{rank}</div>
      <ClimberAvatar level={row.level} gender={row.gender} equipped={row.equipped} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="font-semibold truncate">{row.character_name}</div>
        <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
          <span>Lv {row.level}</span>
          <span className="opacity-50">·</span>
          <span className="flex items-center gap-1"><ScrollText className="h-3 w-3" />{row.total_logs}</span>
          <span className="opacity-50">·</span>
          <span className="flex items-center gap-1"><Skull className="h-3 w-3" />{row.bosses_sent}</span>
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
      <div className="flex items-center gap-1.5 shrink-0">
        <img src={chalkBagImg} alt="" className="h-4 w-4" />
        <span className="text-sm font-bold tabular-nums gradient-chalk-text">{row.total_chalk_earned.toLocaleString()}</span>
      </div>
    </div>
  );
}
