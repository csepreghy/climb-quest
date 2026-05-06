import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Boss, attemptBoss, createBoss, setActiveBoss, useGame } from "@/game/store";
import { STYLES, Style, BOSS_TEMPLATES } from "@/game/data";
import { toast } from "sonner";
import { Plus, Swords, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCard, PixelBar } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";

const BOSS_EMOJIS = ["👹","👺","👻","😈","🗿","🐻","🦍","🐲","🦑","👽","🌀"];

const OUTCOMES: { v: Parameters<typeof attemptBoss>[1]; label: string; tone?: string }[] = [
  { v: "send", label: "Send 🏆", tone: "from-legendary to-accent" },
  { v: "flash", label: "Flash ⚡", tone: "from-legendary to-rare" },
  { v: "high_point", label: "New high point" },
  { v: "zone", label: "Reached zone" },
  { v: "fell_crux", label: "Fell at crux" },
  { v: "fell_low", label: "Fell low" },
  { v: "humbled", label: "Got completely humbled" },
  { v: "retreat", label: "Strategic retreat" },
];

export default function Bosses() {
  const s = useGame();
  return (
    <div className="space-y-5 animate-float-up">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Boss Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Long-term nemeses. Defeat them. Earn glory.</p>
        </div>
        <CreateBoss />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {s.bosses.map(b => <BossCard key={b.id} boss={b} active={!!b.active} onActivate={() => setActiveBoss(b.id)} />)}
      </div>
    </div>
  );
}

function BossCard({ boss, active, onActivate }: { boss: Boss; active: boolean; onActivate: () => void }) {
  const [open, setOpen] = useState(false);

  function attempt(outcome: Parameters<typeof attemptBoss>[1]) {
    const r = attemptBoss(boss.id, outcome);
    if (!r) return;
    setOpen(false);
    if (outcome === "send" || outcome === "flash") {
      toast.success(`${boss.name} DEFEATED!`, { description: `+${r.attempt.chalk} Chalk · ${outcome === "flash" ? "FLASHED" : "Sent"}` });
    } else {
      toast(`Attempt logged on ${boss.name}`, { description: `+${r.attempt.chalk} Chalk` });
    }
  }

  return (
    <GameCard tone={boss.sent ? "legendary" : active ? "boss" : "default"} className={cn("p-5 relative")}>
      {boss.sent && <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-legendary/15 text-legendary border border-legendary/40 flex items-center gap-1"><Crown className="h-3 w-3" /> Sent</div>}
      {active && !boss.sent && <div className="absolute top-3 right-3 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-boss/15 text-boss border border-boss/40">Active</div>}

      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0">{boss.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="font-medium leading-snug truncate pr-16">{boss.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{boss.grade} · {boss.style} · Difficulty {boss.difficulty}/10</div>
          <div className="text-xs italic text-muted-foreground mt-1">"{boss.flavor}"</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span>High point</span><span className="tabular-nums">{boss.highPoint}%</span>
        </div>
        <PixelBar value={boss.highPoint} color="hsl(var(--boss))" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!boss.sent && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <GameButton variant="danger" size="sm"><Swords className="h-4 w-4" /> Attempt</GameButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>How did it go on {boss.name}?</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {OUTCOMES.map(o => (
                  <Button key={o.v} variant="secondary"
                    onClick={() => attempt(o.v)}
                    className={cn("h-auto py-3 justify-start", o.tone && `bg-gradient-to-r ${o.tone} text-primary-foreground`)}>
                    {o.label}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
        {!boss.sent && !active && <GameButton variant="ghost" size="sm" onClick={onActivate}>Set active</GameButton>}
      </div>

      {boss.attempts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground mb-1.5">Attempt history</div>
          <div className="space-y-1 max-h-32 overflow-auto pr-1">
            {boss.attempts.slice(0,8).map(a => (
              <div key={a.id} className="flex justify-between text-xs">
                <span>{new Date(a.date).toLocaleDateString()} · {a.outcome.replace("_"," ")}</span>
                <span className="text-chalk-glow">+{a.chalk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GameCard>
  );
}

function CreateBoss() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("V5");
  const [style, setStyle] = useState<Style>("crimp");
  const [difficulty, setDifficulty] = useState(5);
  const [emoji, setEmoji] = useState("👹");

  function add() {
    if (!name.trim()) { toast.error("Give your nemesis a name"); return; }
    createBoss(name.trim(), grade, style, difficulty, emoji);
    toast.success(`${name} added to your nemesis list`);
    setOpen(false); setName("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2"><Plus className="h-4 w-4" /> New Boss</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a Boss Problem</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Quick templates</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {BOSS_TEMPLATES.map(t => (
                <button key={t.id} type="button"
                  onClick={() => { setName(t.name); setGrade(t.grade); setStyle(t.style); setDifficulty(t.difficulty); setEmoji(t.emoji); }}
                  className="text-xs px-2 py-1 rounded-md bg-secondary border border-border hover:border-accent">
                  {t.emoji} {t.name}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="V5 Slab Menace" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Grade</Label><Input value={grade} onChange={e => setGrade(e.target.value)} /></div>
            <div><Label>Difficulty (1-10)</Label><Input type="number" min={1} max={10} value={difficulty} onChange={e => setDifficulty(Math.max(1, Math.min(10, Number(e.target.value))))} /></div>
          </div>
          <div>
            <Label>Style</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STYLES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {BOSS_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)}
                  className={cn("h-9 w-9 rounded-md border text-xl", emoji === e ? "border-accent bg-accent/20" : "border-border bg-secondary")}>{e}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={add}>Summon</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
