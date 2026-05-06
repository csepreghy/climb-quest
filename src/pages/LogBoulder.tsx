import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityType, BASE_CHALK, STYLES, Style } from "@/game/data";
import { computeChalk, logBoulder, useGame, levelUp, nextLevel } from "@/game/store";
import { useGyms, setLastUsedGym, gradeLabels } from "@/game/gyms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BADGE_BY_ID } from "@/game/data";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { GameButton } from "@/components/ui/game-button";
import { Link } from "react-router-dom";

export default function LogBoulder() {
  const s = useGame();
  const gymState = useGyms();
  const initialGymId = gymState.lastUsedGymId
    ?? gymState.gyms.find(g => g.primary)?.id
    ?? gymState.gyms[0]?.id
    ?? "";
  const [gymId, setGymId] = useState(initialGymId);
  const gym = gymState.gyms.find(g => g.id === gymId) ?? null;
  const gymGradingSystems = (gym?.gradingSystemIds ?? []).map(id => gymState.gradingSystems.find(g => g.id === id)).filter(Boolean);
  const defaultGsId = gymGradingSystems[0]?.id ?? "v_grades";
  const [gsId, setGsId] = useState(defaultGsId);
  useEffect(() => { setGsId(defaultGsId); }, [defaultGsId]);
  const gs = gymState.gradingSystems.find(g => g.id === gsId);
  const grades = gs ? gradeLabels(gs) : [];

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holdColorId, setHoldColorId] = useState<string>("");
  const [grade, setGrade] = useState(grades[0] ?? "V3");
  useEffect(() => { if (grades.length && !grades.includes(grade)) setGrade(grades[0]); }, [grades.join("|")]);
  const [type, setType] = useState<Extract<ActivityType, "warmup_boulder" | "boulder" | "hard_boulder">>("boulder");
  const [sent, setSent] = useState(true);
  const [styles, setStyles] = useState<Style[]>([]);
  const [notes, setNotes] = useState("");
  const [reward, setReward] = useState<{ total: number; base: number; bonuses: { source: string; amount: number }[]; newBadges: string[] } | null>(null);

  const preview = useMemo(
    () => computeChalk(type, styles, sent),
    [type, sent, styles, s.equipped, s.pendingConsumable],
  );

  function toggleStyle(st: Style) {
    setStyles(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  }

  function submit() {
    if (gymId) setLastUsedGym(gymId);
    const holdColor = gym?.holdColors.find(c => c.id === holdColorId);
    const locationStr = [gym?.name, holdColor?.name && `${holdColor.name} hold`].filter(Boolean).join(" · ");
    const res = logBoulder({
      activity: type,
      date: new Date(date).toISOString(),
      location: locationStr || undefined,
      grade,
      styles,
      sent,
      notes,
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
          <p className="text-sm text-muted-foreground">Real-life climbing only. One boulder per log.</p>
        </div>

        {gymState.gyms.length === 0 && (
          <div className="text-xs px-3 py-2 rounded-md border border-[hsl(var(--btn-orange))]/40 bg-[hsl(var(--btn-orange))]/10">
            No gyms yet. <Link to="/gym" className="underline font-semibold">Set up your gym →</Link>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Gym">
            <Select value={gymId} onValueChange={setGymId} disabled={gymState.gyms.length === 0}>
              <SelectTrigger><SelectValue placeholder="Pick a gym" /></SelectTrigger>
              <SelectContent>{gymState.gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}{g.primary ? " ★" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Grading system">
            <Select value={gsId} onValueChange={setGsId} disabled={!gym}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(gymGradingSystems.length ? gymGradingSystems : gymState.gradingSystems).map(g => g && (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Grade">
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{grades.map(gr => <SelectItem key={gr} value={gr}>{gr}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Boulder type">
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="warmup_boulder">Warm-up · +{BASE_CHALK.warmup_boulder}</SelectItem>
                <SelectItem value="boulder">Regular · +{BASE_CHALK.boulder}</SelectItem>
                <SelectItem value="hard_boulder">Hard · +{BASE_CHALK.hard_boulder}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Hold color">
            {gym && gym.holdColors.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {gym.holdColors.map(c => (
                  <button key={c.id} type="button" onClick={() => setHoldColorId(c.id === holdColorId ? "" : c.id)}
                    title={c.name}
                    className={cn("h-8 w-8 rounded-md border-2 transition",
                      holdColorId === c.id ? "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40" : "border-[hsl(var(--panel-frame))] hover:border-[hsl(var(--btn-orange))]")}
                    style={{ background: c.hex }} />
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">Add hold colors in My Gym.</div>
            )}
          </Field>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sent}
            onChange={e => setSent(e.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--chalk))]"
          />
          <span className="text-sm">
            Sent it <span className="text-muted-foreground text-xs">(+{BASE_CHALK.boulder_send} Chalk)</span>
          </span>
        </label>

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
          <GameButton variant="success" size="lg" onClick={submit}>Send it 🪨</GameButton>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="gradient-card p-5">
          <h3 className="font-display font-bold mb-2">Reward Summary</h3>
          {!reward ? (
            <p className="text-sm text-muted-foreground">Log a boulder to see your loot.</p>
          ) : (
            <div className="space-y-3">
              <div className="text-3xl font-bold gradient-chalk-text">+{reward.total} Chalk</div>
              <div className="text-xs text-muted-foreground">Base: {reward.base}</div>
              {reward.bonuses.map((b, i) => (
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
            Equipped gear gives small Chalk multipliers on future logs. Some items only proc on matching styles — pick your loadout!
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
