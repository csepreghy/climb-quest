import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameButton } from "@/components/ui/game-button";
import { ActivityType, BASE_CHALK, STYLES, Style } from "@/game/data";
import { computeChalk, logBoulder, AttemptType } from "@/game/store";
import { useGyms, setLastUsedGym, gradeLabels } from "@/game/gyms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import boulderImg from "@/assets/log-boulder.webp";
import bossImg from "@/assets/log-boss.webp";
import { PickCard } from "@/components/pixel/PickCard";

type Mode = "pick" | "form";
type Kind = "boulder" | "boss";

export function LogModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [mode, setMode] = useState<Mode>("pick");
  const [kind, setKind] = useState<Kind>("boulder");

  useEffect(() => { if (open) setMode("pick"); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {mode === "pick" ? (
          <>
            <DialogHeader>
              <DialogTitle>Log a climb</DialogTitle>
            </DialogHeader>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <PickCard
                image={boulderImg}
                title="Boulder"
                desc="Within your abilities — first try, or several attempts in a single session."
                onClick={() => { setKind("boulder"); setMode("form"); }}
                ring="ring-[hsl(var(--btn-green))]/60"
              />
              <PickCard
                image={bossImg}
                title="Boss Project"
                desc="Hard. Multi-session grind. Your nemesis."
                onClick={() => { setKind("boss"); setMode("form"); }}
                ring="ring-[hsl(var(--boss))]/70"
              />
            </div>
          </>
        ) : (
          <LogForm
            kind={kind}
            onBack={() => setMode("pick")}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}



function LogForm({ kind, onBack, onDone }: { kind: Kind; onBack: () => void; onDone: () => void }) {
  const gymState = useGyms();
  const initialGymId = gymState.lastUsedGymId
    ?? gymState.gyms.find(g => g.primary)?.id
    ?? gymState.gyms[0]?.id
    ?? "";
  const [gymId, setGymId] = useState(initialGymId);
  const gym = gymState.gyms.find(g => g.id === gymId) ?? null;

  const gymGradingSystems = (gym?.gradingSystemIds ?? [])
    .map(id => gymState.gradingSystems.find(g => g.id === id))
    .filter((g): g is NonNullable<typeof g> => !!g);

  const availableSystems = gym && gymGradingSystems.length > 0 ? gymGradingSystems : gymState.gradingSystems;
  const defaultGsId = availableSystems[0]?.id ?? "v_grades";
  const [gsId, setGsId] = useState(defaultGsId);
  useEffect(() => { setGsId(availableSystems[0]?.id ?? "v_grades"); }, [gymId]);
  const gs = gymState.gradingSystems.find(g => g.id === gsId);
  const grades = gs ? gradeLabels(gs) : [];

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holdColorId, setHoldColorId] = useState<string>("");
  const [grade, setGrade] = useState(grades[0] ?? "V3");
  const [gradeMax, setGradeMax] = useState<string>("");
  const [useRange, setUseRange] = useState(false);
  useEffect(() => { if (grades.length && !grades.includes(grade)) setGrade(grades[0]); }, [grades.join("|")]);

  const [activity, setActivity] = useState<Extract<ActivityType, "warmup_boulder" | "boulder" | "hard_boulder">>("boulder");
  const [attemptType, setAttemptType] = useState<AttemptType>("send");
  const [styles, setStyles] = useState<Style[]>([]);
  const [notes, setNotes] = useState("");
  const [celebrating, setCelebrating] = useState<{ total: number } | null>(null);

  const sent = attemptType === "flash" || attemptType === "send";
  const flashed = attemptType === "flash";
  const preview = useMemo(
    () => computeChalk(kind === "boss" ? (sent ? "boss_send" : "boss_attempt") : activity, styles, kind === "boss" ? false : sent, kind === "boss" ? false : flashed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity, attemptType, styles.join(","), kind],
  );

  function toggleStyle(st: Style) {
    setStyles(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  }

  function submit() {
    if (gymId) setLastUsedGym(gymId);
    const holdColor = gym?.holdColors.find(c => c.id === holdColorId);
    const locationStr = [gym?.name, holdColor?.name && `${holdColor.name} hold`].filter(Boolean).join(" · ");
    const act: ActivityType = kind === "boss" ? (sent ? "boss_send" : "boss_attempt") : activity;
    const res = logBoulder({
      activity: act,
      date: new Date(date).toISOString(),
      location: locationStr || undefined,
      grade,
      gradeMax: useRange ? gradeMax || undefined : undefined,
      styles,
      sent: kind === "boss" ? false : sent,
      notes,
      isBoss: kind === "boss",
      attemptType,
      holdColorId: holdColorId || undefined,
      gymId: gymId || undefined,
    });
    setCelebrating({ total: res.log.chalkTotal });
    toast.success(`+${res.log.chalkTotal} Chalk earned`);
    setTimeout(() => { setCelebrating(null); onDone(); }, 1600);
  }

  if (celebrating) {
    return (
      <div className="py-12 text-center">
        <img src={chalkBagImg} alt="Chalk" className="h-20 w-20 mx-auto object-contain animate-bounce drop-shadow-[0_4px_12px_hsl(var(--btn-orange)/0.5)]" />
        <div className="mt-4 menu-label">Sent it!</div>
        <div className="mt-2 text-4xl font-bold gradient-chalk-text animate-pop-in">+{celebrating.total} Chalk</div>
        <Sparkles className="h-6 w-6 mx-auto mt-3 text-chalk-glow animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          <DialogTitle>{kind === "boss" ? "Log Boss Project" : "Log Boulder"}</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid gap-3 sm:grid-cols-2">
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
            <Select value={gsId} onValueChange={setGsId} disabled={availableSystems.length <= 1}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableSystems.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label={useRange ? "Grade (min)" : "Grade"}>
            <div className="flex gap-2">
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{grades.map(gr => <SelectItem key={gr} value={gr}>{gr}</SelectItem>)}</SelectContent>
              </Select>
              <button type="button" onClick={() => setUseRange(r => !r)}
                className="text-xs px-2 rounded-md border border-border bg-secondary/50 whitespace-nowrap">
                {useRange ? "Single" : "Range"}
              </button>
            </div>
          </Field>
          {useRange && (
            <Field label="Grade (max)">
              <Select value={gradeMax || grade} onValueChange={setGradeMax}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{grades.map(gr => <SelectItem key={gr} value={gr}>{gr}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          {kind === "boulder" && (
            <Field label="Boulder type">
              <Select value={activity} onValueChange={(v) => setActivity(v as typeof activity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="warmup_boulder">Warm-up · +{BASE_CHALK.warmup_boulder}</SelectItem>
                  <SelectItem value="boulder">Regular · +{BASE_CHALK.boulder}</SelectItem>
                  <SelectItem value="hard_boulder">Hard · +{BASE_CHALK.hard_boulder}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
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

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Attempt</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              { v: "flash", label: "Flash ⚡", desc: "First try" },
              { v: "send", label: "Send 🏆", desc: "Multi-try, 1 sesh" },
              { v: "project", label: "Project 🎯", desc: "Multi-session" },
            ] as { v: AttemptType; label: string; desc: string }[]).map(o => (
              <button key={o.v} type="button" onClick={() => setAttemptType(o.v)}
                className={cn("rounded-lg p-2.5 text-left border-2 transition",
                  attemptType === o.v
                    ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15"
                    : "border-border bg-secondary/40 hover:border-[hsl(var(--btn-orange))]/60")}>
                <div className="text-sm font-bold">{o.label}</div>
                <div className="text-[10px] text-muted-foreground">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Style</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STYLES.map(st => (
              <button key={st} type="button" onClick={() => toggleStyle(st)}
                className={cn("text-xs px-2.5 py-1 rounded-full border capitalize transition",
                  styles.includes(st)
                    ? "bg-accent text-accent-foreground border-accent"
                    : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground")}>
                {st}
              </button>
            ))}
          </div>
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Beta unlocked. Tried not to scream." rows={2} />
        </Field>

        <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          <div className="flex justify-between items-center gap-2 font-bold">
            <span className="flex items-center gap-1.5">
              Preview reward
              {preview.bonuses.length > 0 && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" aria-label="Show bonus breakdown" className="text-muted-foreground hover:text-foreground">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4 font-semibold">
                          <span>Base</span><span className="tabular-nums">{preview.base}</span>
                        </div>
                        {preview.bonuses.map((b, i) => (
                          <div key={i} className="flex justify-between gap-4">
                            <span>+ {b.source}</span>
                            <span className="tabular-nums">+{b.amount}</span>
                          </div>
                        ))}
                        <div className="border-t border-border/60 pt-1 flex justify-between gap-4 font-semibold">
                          <span>Total</span><span className="tabular-nums">+{preview.total}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </span>
            <span className="tabular-nums">
              <span className="text-muted-foreground font-normal">{preview.base}</span>
              {preview.bonuses.length > 0 && (
                <span className="text-chalk-glow font-normal"> + {preview.bonuses.reduce((a, b) => a + b.amount, 0)}</span>
              )}
              <span className="text-muted-foreground font-normal"> = </span>
              <span className="gradient-chalk-text">+{preview.total} Chalk</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <GameButton variant="ghost" size="sm" onClick={onBack}>Back</GameButton>
        <GameButton variant="success" size="md" onClick={submit}>Send it 🪨</GameButton>
      </div>
    </>
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
