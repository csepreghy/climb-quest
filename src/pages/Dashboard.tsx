import { useGame, currentLevel, nextLevel, levelUp, activeBoss } from "@/game/store";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { ITEM_BY_ID, BADGE_BY_ID, ACTIVITY_LABELS } from "@/game/data";
import { toast } from "sonner";
import { ScrollText, Swords, ArrowUp, Sparkles, Trophy } from "lucide-react";

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
    toast.success(`Level Up! You are now ${nextLevel({...s, level: s.level+1})?.title ?? cur.title}!`, {
      description: `Unlocked: ${r.unlocks?.join(", ")}`,
    });
  };

  return (
    <div className="space-y-6 animate-float-up">
      {/* Hero card */}
      <Card className="gradient-card p-5 sm:p-7 border-border/80 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Lv {s.level} · {cur.title}</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1 gradient-chalk-text">{titleName}</h1>
            <p className="text-muted-foreground mt-1 italic">"{cur.desc}"</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">
                  {next ? <>Chalk to <span className="text-foreground font-semibold">{next.title}</span></> : "Maxed out, demigod."}
                </span>
                <span className="tabular-nums font-semibold">
                  {next ? <><span className="gradient-chalk-text">{s.chalk.toLocaleString()}</span> / {next.cost.toLocaleString()}</> : `${s.chalk.toLocaleString()} Chalk`}
                </span>
              </div>
              <Progress value={progress} className="h-2.5" />
            </div>

            <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button size="lg" onClick={() => nav("/log")} className="gap-2 shadow-glow">
                <ScrollText className="h-4 w-4" /> Log Boulder
              </Button>
              <Button size="lg" variant="secondary" onClick={() => nav("/bosses")} className="gap-2">
                <Swords className="h-4 w-4" /> Attempt Boss
              </Button>
              {next && s.chalk >= next.cost && (
                <Button size="lg" variant="default" onClick={onLevelUp}
                  className="gap-2 bg-gradient-to-r from-legendary to-accent text-primary-foreground hover:opacity-90 animate-chalk-pulse">
                  <ArrowUp className="h-4 w-4" /> Level Up ({next.cost} Chalk)
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Equipped */}
        <Card className="gradient-card p-5">
          <h3 className="font-display font-bold flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-legendary" /> Equipped</h3>
          <div className="space-y-1.5 text-sm">
            {(["shoes","chalk","outfit","bottoms","accessory","aura","title"] as const).map(slot => {
              const id = s.equipped[slot];
              const it = id ? ITEM_BY_ID[id] : null;
              return (
                <div key={slot} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                  <span className="text-muted-foreground capitalize text-xs">{slot}</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    {it ? <>{it.emoji} {it.name}</> : <span className="text-muted-foreground italic">empty</span>}
                  </span>
                </div>
              );
            })}
          </div>
          {s.pendingConsumable && (
            <div className="mt-3 text-xs px-2 py-1.5 rounded-md bg-chalk-glow/10 border border-chalk-glow/40">
              ⚡ Next log boosted by {ITEM_BY_ID[s.pendingConsumable]?.name}
            </div>
          )}
        </Card>

        {/* Active boss */}
        <Card className="gradient-card p-5">
          <h3 className="font-display font-bold flex items-center gap-2 mb-3"><Swords className="h-4 w-4 text-boss" /> Active Boss</h3>
          {boss ? (
            <Link to="/bosses" className="block group">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{boss.emoji}</div>
                <div className="min-w-0">
                  <div className="font-bold truncate group-hover:text-accent transition-colors">{boss.name}</div>
                  <div className="text-xs text-muted-foreground">{boss.grade} · {boss.style}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>High point</span><span>{boss.highPoint}%</span>
                </div>
                <Progress value={boss.highPoint} className="h-2" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{boss.attempts.length} attempts</div>
            </Link>
          ) : (
            <div className="text-sm text-muted-foreground">No active boss. Pick a nemesis →</div>
          )}
        </Card>

        {/* Badges */}
        <Card className="gradient-card p-5">
          <h3 className="font-display font-bold flex items-center gap-2 mb-3"><Trophy className="h-4 w-4 text-legendary" /> Badges</h3>
          {s.badges.length === 0 ? (
            <div className="text-sm text-muted-foreground">No badges yet. Log something — anything!</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {s.badges.slice(0, 12).map(id => {
                const b = BADGE_BY_ID[id]; if (!b) return null;
                return (
                  <div key={id} title={b.desc} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-secondary border border-border">
                    <span>{b.emoji}</span><span>{b.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent logs */}
      <Card className="gradient-card p-5">
        <h3 className="font-display font-bold mb-3">Recent Boulder Logs</h3>
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
                  <div className="font-medium truncate">{ACTIVITY_LABELS[l.activity]}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(l.date).toLocaleDateString()} · {l.styles.slice(0,2).join(", ") || "—"}{l.grade ? ` · ${l.grade}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold gradient-chalk-text tabular-nums">+{l.chalkTotal}</div>
                  {l.chalkBonus > 0 && <div className="text-[10px] text-muted-foreground">incl. +{l.chalkBonus} bonus</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
