import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useGame, currentLevel, nextLevel, levelUp, setGender, resetGame } from "@/game/store";
import { LEVELS, BADGES, BADGE_BY_ID } from "@/game/data";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Lock, ArrowUp } from "lucide-react";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";

export default function Character() {
  const s = useGame();
  const cur = currentLevel(s);
  const next = nextLevel(s);
  const earnedBadges = new Set(s.badges);

  return (
    <div className="space-y-6 animate-float-up">
      <Card className="gradient-card p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          <div className="flex-1 text-center md:text-left">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Lv {s.level} · {cur.title}</div>
            <p className="text-muted-foreground italic mt-2">"{cur.desc}"</p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
              {(["male","female","neutral"] as const).map(g => (
                <Button key={g} size="sm" variant={s.gender === g ? "default" : "secondary"} onClick={() => setGender(g)} className="capitalize">{g}</Button>
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Chalk</div>
            <div className="text-3xl font-bold gradient-chalk-text">{s.chalk.toLocaleString()}</div>
            {next && (
              <Button className="mt-3 gap-2 bg-gradient-to-r from-legendary to-accent" disabled={s.chalk < next.cost}
                onClick={() => { const target = next?.title ?? ""; const r = levelUp(); if (r.ok) { showLevelUpBanner(target, r.unlocks ?? []); toast.success("Level up!"); } else toast.error(r.reason ?? ""); }}>
                <ArrowUp className="h-4 w-4" /> Level Up ({next.cost})
              </Button>
            )}
          </div>
        </div>
        {next && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Next: {next.title}</span><span>{s.chalk.toLocaleString()} / {next.cost.toLocaleString()}</span>
            </div>
            <Progress value={Math.min(100, (s.chalk / next.cost) * 100)} className="h-2" />
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total logs" value={s.stats.totalLogs} />
        <Stat label="Total sends" value={s.stats.totalSends} />
        <Stat label="Total flashes" value={s.stats.totalFlashes} />
        <Stat label="Bosses defeated" value={s.stats.bossesSent} />
      </div>

      <Card className="gradient-card p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {LEVELS.map(l => {
            const unlocked = s.level >= l.level;
            const isCurrent = s.level === l.level;
            return (
              <div key={l.level} className={cn("flex gap-3 p-3 rounded-xl border transition",
                isCurrent ? "border-accent bg-accent/10" : unlocked ? "border-border bg-secondary/30" : "border-border/50 opacity-60")}>
                <div className="text-3xl">{unlocked ? l.emoji : <Lock className="h-6 w-6 mt-1.5" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Lv {l.level}</span>
                    <span className="font-semibold truncate">{l.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{l.desc}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {l.level === 1 ? "Starter" : `${l.cost.toLocaleString()} Chalk`} · {l.unlocks.length} unlocks
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="gradient-card p-5">
        <h2 className="font-display font-bold mb-4">Badges ({s.badges.length}/{BADGES.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {BADGES.map(b => {
            const have = earnedBadges.has(b.id);
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
      </Card>

      <div className="text-center pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground"
          onClick={() => { if (confirm("Reset all progress? This cannot be undone.")) { resetGame(); toast("Progress reset"); } }}>
          Reset progress
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gradient-card p-4 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1 gradient-chalk-text">{value}</div>
    </Card>
  );
}
