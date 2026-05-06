import { useGame, currentLevel, nextLevel, levelUp, activeBoss } from "@/game/store";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { GameButton } from "@/components/ui/game-button";
import { GameCard, PixelBar } from "@/components/ui/game-card";
import { Link, useNavigate } from "react-router-dom";
import { ITEM_BY_ID, BADGE_BY_ID, ACTIVITY_LABELS } from "@/game/data";
import { toast } from "sonner";
import { ScrollText, Swords, ArrowUp, Sparkles, Trophy } from "lucide-react";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { getBossSprite } from "@/components/pixel/sprites";

export default function Dashboard() {
  const s = useGame();
  const cur = currentLevel(s);
  const next = nextLevel(s);
  const boss = activeBoss(s);
  const nav = useNavigate();
  const titleId = s.equipped.title;
  const titleName = titleId ? ITEM_BY_ID[titleId]?.name.replace(/^Title:\s*/,"") : cur.title;
  const progress = next ? Math.min(100, Math.round((s.chalk / next.cost) * 100)) : 100;

  const onLevelUp = () => {
    const r = levelUp();
    if (!r.ok) { toast.error(r.reason ?? "Cannot level up"); return; }
    const nl = nextLevel({...s, level: s.level + 1, chalk: s.chalk - (next?.cost ?? 0)});
    showLevelUpBanner(nextLevel(s)?.title ?? cur.title, r.unlocks ?? []);
    void nl;
  };

  return (
    <div className="space-y-6 animate-float-up">
      {/* Hero card */}
      <GameCard tone="accent" className="p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="font-pixel text-[10px] uppercase tracking-widest text-muted-foreground">Lv {s.level} · {cur.title}</div>
            <h1 className="font-pixel text-2xl sm:text-3xl mt-2 gradient-chalk-text text-shadow-pixel leading-snug">{titleName}</h1>
            <p className="text-muted-foreground mt-2 italic text-sm">"{cur.desc}"</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-baseline justify-between text-xs font-pixel">
                <span className="text-muted-foreground">
                  {next ? <>NEXT: <span className="text-foreground">{next.title}</span></> : "MAX LEVEL"}
                </span>
                <span className="tabular-nums">
                  {next ? <><span className="gradient-chalk-text">{s.chalk.toLocaleString()}</span> / {next.cost.toLocaleString()}</> : `${s.chalk.toLocaleString()}`}
                </span>
              </div>
              <PixelBar value={progress} max={100} color="linear-gradient(90deg, hsl(var(--legendary)), hsl(var(--accent)))" />
            </div>

            <div className="mt-5 flex flex-wrap gap-3 justify-center sm:justify-start">
              <GameButton variant="primary" size="lg" onClick={() => nav("/log")}>
                <ScrollText className="h-4 w-4" /> Log Boulder
              </GameButton>
              <GameButton variant="danger" size="lg" onClick={() => nav("/bosses")}>
                <Swords className="h-4 w-4" /> Attempt Boss
              </GameButton>
              {next && s.chalk >= next.cost && (
                <GameButton variant="legendary" size="lg" onClick={onLevelUp} className="animate-chalk-pulse">
                  <ArrowUp className="h-4 w-4" /> Level Up
                </GameButton>
              )}
            </div>
          </div>
        </div>
      </GameCard>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Equipped */}
        <GameCard className="p-5">
          <h3 className="font-pixel text-xs flex items-center gap-2 mb-3 text-shadow-pixel"><Sparkles className="h-4 w-4 text-legendary" /> EQUIPPED</h3>
          <div className="space-y-1.5 text-sm">
            {(["shoes","chalk","outfit","bottoms","accessory","aura","title"] as const).map(slot => {
              const id = s.equipped[slot];
              const it = id ? ITEM_BY_ID[id] : null;
              return (
                <div key={slot} className="flex items-center justify-between py-1 border-b border-dashed border-border/40 last:border-0">
                  <span className="text-muted-foreground capitalize text-[10px] font-pixel">{slot}</span>
                  <span className="flex items-center gap-1.5 font-medium text-sm">
                    {it ? <>{it.emoji} {it.name}</> : <span className="text-muted-foreground italic">empty</span>}
                  </span>
                </div>
              );
            })}
          </div>
          {s.pendingConsumable && (
            <div className="mt-3 text-xs px-2 py-1.5 rounded-md bg-chalk-glow/10 border-2 border-chalk-glow/40 font-pixel text-[10px]">
              ⚡ NEXT LOG BOOSTED: {ITEM_BY_ID[s.pendingConsumable]?.name}
            </div>
          )}
        </GameCard>

        {/* Active boss */}
        <GameCard tone="boss" className="p-5">
          <h3 className="font-pixel text-xs flex items-center gap-2 mb-3 text-shadow-pixel"><Swords className="h-4 w-4 text-boss" /> ACTIVE BOSS</h3>
          {boss ? (
            <Link to="/bosses" className="block group">
              <div className="flex items-center gap-3">
                <div className="bg-background/60 rounded-md border-2 border-border p-1">
                  <PixelSprite sprite={getBossSprite(boss.id)} pixel={4} aura="hsl(var(--boss))" />
                </div>
                <div className="min-w-0">
                  <div className="font-pixel text-xs truncate group-hover:text-boss transition-colors">{boss.name}</div>
                  <div className="text-[10px] text-muted-foreground font-pixel mt-1">{boss.grade} · {boss.style}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-pixel text-muted-foreground mb-1">
                  <span>HP</span><span>{boss.highPoint}%</span>
                </div>
                <PixelBar value={boss.highPoint} color="linear-gradient(90deg, hsl(var(--boss)), hsl(15 85% 60%))" />
              </div>
              <div className="mt-2 text-[10px] font-pixel text-muted-foreground">{boss.attempts.length} ATTEMPTS</div>
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground">No active boss. Pick a nemesis →</div>
          )}
        </GameCard>

        {/* Badges */}
        <GameCard tone="legendary" className="p-5">
          <h3 className="font-pixel text-xs flex items-center gap-2 mb-3 text-shadow-pixel"><Trophy className="h-4 w-4 text-legendary" /> BADGES</h3>
          {s.badges.length === 0 ? (
            <div className="text-sm text-muted-foreground">No badges yet. Log something — anything!</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {s.badges.slice(0, 12).map(id => {
                const b = BADGE_BY_ID[id]; if (!b) return null;
                return (
                  <div key={id} title={b.desc} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-secondary border-2 border-legendary/40 shadow-[2px_2px_0_0_hsl(240_10%_2%)]">
                    <span>{b.emoji}</span><span className="font-pixel text-[9px]">{b.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GameCard>
      </div>

      {/* Recent logs */}
      <GameCard className="p-5">
        <h3 className="font-pixel text-xs mb-3 text-shadow-pixel">RECENT LOGS</h3>
        {s.logs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            <p className="text-2xl mb-2">🪨</p>
            No logs yet. Send something — even a humbling slab counts.
          </div>
        ) : (
          <div className="divide-y divide-dashed divide-border/40">
            {s.logs.slice(0, 6).map(l => (
              <div key={l.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{ACTIVITY_LABELS[l.activity]}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.date).toLocaleDateString()} · {l.styles.slice(0,2).join(", ") || "—"}{l.grade ? ` · ${l.grade}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-pixel gradient-chalk-text tabular-nums">+{l.chalkTotal}</div>
                  {l.chalkBonus > 0 && <div className="text-[9px] font-pixel text-muted-foreground">+{l.chalkBonus} BONUS</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </GameCard>
    </div>
  );
}
