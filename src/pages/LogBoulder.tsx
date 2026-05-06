import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityType, ACTIVITY_LABELS, Result, STYLES, Style } from "@/game/data";
import { computeChalk, logBoulder, useGame, levelUp, nextLevel } from "@/game/store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BADGE_BY_ID } from "@/game/data";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { GameButton } from "@/components/ui/game-button";

const LOCATIONS = ["Indoor gym","Outdoor boulders","Board","Spray wall","Moonboard","Kilter board"];
const RESULTS: { value: Result; label: string }[] = [
  { value: "session", label: "Session" },
  { value: "project_attempt", label: "Project attempt" },
  { value: "send", label: "Send" },
  { value: "flash", label: "Flash" },
  { value: "competition", label: "Competition" },
  { value: "humbled", label: "Got humbled" },
];

export default function LogBoulder() {
  const s = useGame();
  const nav = useNavigate();
  const [activity, setActivity] = useState<ActivityType>("indoor");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [duration, setDuration] = useState<number | "">(60);
  const [location, setLocation] = useState("Indoor gym");
  const [grade, setGrade] = useState("V3");
  const [styles, setStyles] = useState<Style[]>([]);
  const [result, setResult] = useState<Result>("session");
  const [tried, setTried] = useState<number | "">(8);
  const [sends, setSends] = useState<number | "">(2);
  const [hardest, setHardest] = useState("V3");
  const [notes, setNotes] = useState("");
  const [reward, setReward] = useState<{ total:number; base:number; bonuses: {source:string; amount:number}[]; newBadges: string[] } | null>(null);

  const preview = useMemo(() => computeChalk(activity, styles, result), [activity, styles, result, s.equipped, s.pendingConsumable]);

  function toggleStyle(st: Style) {
    setStyles(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  }

  function submit() {
    const res = logBoulder({
      activity, date: new Date(date).toISOString(),
      duration: duration === "" ? undefined : Number(duration),
      location, grade,
      styles, result,
      problemsTried: tried === "" ? undefined : Number(tried),
      sends: sends === "" ? undefined : Number(sends),
      hardestSend: hardest, notes,
    });
    setReward({ total: res.log.chalkTotal, base: res.log.chalkBase, bonuses: res.breakdown.bonuses, newBadges: res.newBadges });
    toast.success(`+${res.log.chalkTotal} Chalk earned`, {
      description: res.breakdown.bonuses.length ? `Bonuses from ${res.breakdown.bonuses.map(b => b.source).join(", ")}` : "Pure crimp power.",
    });
  }

  const next = nextLevel(s);
  const canLevel = next && s.chalk >= next.cost;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,360px] animate-float-up">
      <Card className="gradient-card p-5 sm:p-6 space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold">Log a Boulder</h1>
          <p className="text-sm text-muted-foreground">Real-life climbing only. Chalk does not grow on chalk bags.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Activity">
            <Select value={activity} onValueChange={(v) => setActivity(v as ActivityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map(a => (
                  <SelectItem key={a} value={a}>{ACTIVITY_LABELS[a]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Duration (min)">
            <Input type="number" value={duration} onChange={e => setDuration(e.target.value === "" ? "" : Number(e.target.value))} />
          </Field>
          <Field label="Location">
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Grade (e.g. V4, 6B+)">
            <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="V4" />
          </Field>
          <Field label="Result">
            <Select value={result} onValueChange={(v) => setResult(v as Result)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RESULTS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Problems tried">
            <Input type="number" value={tried} onChange={e => setTried(e.target.value === "" ? "" : Number(e.target.value))} />
          </Field>
          <Field label="Sends">
            <Input type="number" value={sends} onChange={e => setSends(e.target.value === "" ? "" : Number(e.target.value))} />
          </Field>
          <Field label="Hardest send">
            <Input value={hardest} onChange={e => setHardest(e.target.value)} placeholder="V5" />
          </Field>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Style</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {STYLES.map(st => (
              <button key={st} type="button" onClick={() => toggleStyle(st)}
                className={cn("text-xs px-3 py-1.5 rounded-full border capitalize transition",
                  styles.includes(st)
                    ? "bg-accent text-accent-foreground border-accent shadow-glow"
                    : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground")}>
                {st}
              </button>
            ))}
          </div>
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Got humbled by the crux. Beta unlocked. Tried not to scream." />
        </Field>

        <div className="flex flex-wrap gap-3 items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Preview reward:{" "}
            <span className="font-bold gradient-chalk-text">+{preview.total} Chalk</span>
            {preview.bonuses.length > 0 && <span className="text-xs"> (base {preview.base} + bonuses {preview.total - preview.base})</span>}
          </div>
          <GameButton variant="primary" size="lg" onClick={submit}>Send it 🪨</GameButton>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="gradient-card p-5">
          <h3 className="font-display font-bold mb-2">Reward Summary</h3>
          {!reward ? (
            <p className="text-sm text-muted-foreground">Log an activity to see your loot.</p>
          ) : (
            <div className="space-y-3">
              <div className="text-3xl font-bold gradient-chalk-text">+{reward.total} Chalk</div>
              <div className="text-xs text-muted-foreground">Base: {reward.base}</div>
              {reward.bonuses.map((b,i) => (
                <div key={i} className="text-sm flex justify-between">
                  <span>{b.source}</span>
                  <span className="text-chalk-glow">+{b.amount}</span>
                </div>
              ))}
              {reward.newBadges.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">New badges</div>
                  <div className="flex flex-wrap gap-1.5">
                    {reward.newBadges.map(id => {
                      const b = BADGE_BY_ID[id]; if (!b) return null;
                      return <span key={id} className="text-xs px-2 py-1 rounded-full bg-legendary/20 border border-legendary/50">{b.emoji} {b.name}</span>;
                    })}
                  </div>
                </div>
              )}
              {canLevel && (
                <div className="pt-3">
                  <GameButton variant="legendary" className="w-full animate-chalk-pulse" onClick={() => {
                    const target = next?.title ?? "";
                    const r = levelUp();
                    if (r.ok) { showLevelUpBanner(target, r.unlocks ?? []); toast.success("Level up!"); }
                  }}>
                    Spend {next?.cost} → {next?.title}
                  </GameButton>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="gradient-card p-5">
          <h3 className="font-display font-bold mb-2 text-sm">Pro tip</h3>
          <p className="text-xs text-muted-foreground">
            Equipped gear gives small Chalk multipliers on future logs. Some items only proc on matching styles or activities — pick your loadout!
          </p>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
