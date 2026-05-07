import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameButton } from "@/components/ui/game-button";
import { ActivityType, BASE_CHALK, STYLES, Style } from "@/game/data";
import { computeChalk, logBoulder, AttemptType, useGame, ChalkBreakdown } from "@/game/store";
import { useGyms, setLastUsedGym, gradeLabels } from "@/game/gyms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles, Info, Swords, Trophy } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import boulderImg from "@/assets/log-boulder.webp";
import chalkBagImg from "@/assets/chalk-bag.png";
import bossImg from "@/assets/log-boss.webp";
import { PickCard } from "@/components/pixel/PickCard";
import { ClimberAvatar } from "@/components/ClimberAvatar";

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
        ) : kind === "boss" ? (
          <BossForm onBack={() => setMode("pick")} onDone={() => onOpenChange(false)} />
        ) : (
          <BoulderForm onBack={() => setMode("pick")} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function HeaderImage({ src, alt, ring }: { src: string; alt: string; ring: string }) {
  return (
    <div className={cn("h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 border-[hsl(var(--panel-frame))]", ring)}>
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

// ===================== BOULDER FORM =====================

function BoulderForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
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
    () => computeChalk(activity, styles, sent, flashed),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity, attemptType, styles.join(",")],
  );

  function toggleStyle(st: Style) {
    setStyles(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  }

  function submit() {
    if (gymId) setLastUsedGym(gymId);
    const holdColor = gym?.holdColors.find(c => c.id === holdColorId);
    const locationStr = [gym?.name, holdColor?.name && `${holdColor.name} hold`].filter(Boolean).join(" · ");
    const res = logBoulder({
      activity,
      date: new Date(date).toISOString(),
      location: locationStr || undefined,
      grade,
      gradeMax: useRange ? gradeMax || undefined : undefined,
      styles,
      sent,
      notes,
      isBoss: false,
      attemptType,
      holdColorId: holdColorId || undefined,
      gymId: gymId || undefined,
    });
    setCelebrating({ total: res.log.chalkTotal });
    toast.success(`+${res.log.chalkTotal} Chalk earned`);
    setTimeout(() => { setCelebrating(null); onDone(); }, 1600);
  }

  if (celebrating) return <SimpleCelebrate total={celebrating.total} label="Sent it!" />;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          <HeaderImage src={boulderImg} alt="Boulder" ring="ring-2 ring-[hsl(var(--btn-green))]/40" />
          <DialogTitle>Log Boulder</DialogTitle>
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

        <PreviewReward preview={preview} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <GameButton variant="ghost" size="sm" onClick={onBack}>Back</GameButton>
        <GameButton variant="success" size="md" onClick={submit}>Send it 🪨</GameButton>
      </div>
    </>
  );
}

// ===================== BOSS FORM =====================

type BossStep = "main" | "attempts" | "celebrate";
type AttemptTier = "1-5" | "6-10" | "10+";

const ATTEMPT_TIERS: { v: AttemptTier; label: string; mult: number; desc: string }[] = [
  { v: "1-5", label: "1–5 attempts", mult: 0.5, desc: "Just getting acquainted" },
  { v: "6-10", label: "6–10 attempts", mult: 1.0, desc: "Dialing in the beta" },
  { v: "10+", label: "10+ attempts", mult: 1.5, desc: "Full grind mode" },
];

function BossForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
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
  const [gsId, setGsId] = useState(availableSystems[0]?.id ?? "v_grades");
  useEffect(() => { setGsId(availableSystems[0]?.id ?? "v_grades"); }, [gymId]);
  const gs = gymState.gradingSystems.find(g => g.id === gsId);
  const grades = gs ? gradeLabels(gs) : [];

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holdColorId, setHoldColorId] = useState<string>("");
  const [grade, setGrade] = useState(grades[0] ?? "V5");
  useEffect(() => { if (grades.length && !grades.includes(grade)) setGrade(grades[0]); }, [grades.join("|")]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [notes, setNotes] = useState("");

  const [step, setStep] = useState<BossStep>("main");
  const [celebrate, setCelebrate] = useState<{ total: number; defeated: boolean } | null>(null);

  function toggleStyle(st: Style) {
    setStyles(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  }

  function commit(outcome: "attempt" | "defeat", attemptTier?: AttemptTier) {
    if (gymId) setLastUsedGym(gymId);
    const holdColor = gym?.holdColors.find(c => c.id === holdColorId);
    const locationStr = [gym?.name, holdColor?.name && `${holdColor.name} hold`].filter(Boolean).join(" · ");
    const activity: ActivityType = outcome === "defeat" ? "boss_send" : "boss_attempt";
    const mult = outcome === "attempt" ? (ATTEMPT_TIERS.find(t => t.v === attemptTier)?.mult ?? 1) : 1;
    const res = logBoulder({
      activity,
      date: new Date(date).toISOString(),
      location: locationStr || undefined,
      grade,
      styles,
      sent: outcome === "defeat",
      notes: outcome === "attempt" && attemptTier ? `${attemptTier} attempts${notes ? " · " + notes : ""}` : notes,
      isBoss: true,
      attemptType: outcome === "defeat" ? "send" : "project",
      holdColorId: holdColorId || undefined,
      gymId: gymId || undefined,
      chalkMultiplier: mult,
    });
    setCelebrate({ total: res.log.chalkTotal, defeated: outcome === "defeat" });
    toast.success(`+${res.log.chalkTotal} Chalk earned`);
    setTimeout(() => { setCelebrate(null); onDone(); }, outcome === "defeat" ? 2600 : 1600);
  }

  if (celebrate) {
    return celebrate.defeated
      ? <BossCelebrate total={celebrate.total} />
      : <SimpleCelebrate total={celebrate.total} label="Logged attempt!" image={bossImg} alt="Boss" />;
  }

  if (step === "attempts") {
    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("main")} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
            <HeaderImage src={bossImg} alt="Boss" ring="ring-2 ring-[hsl(var(--boss))]/50" />
            <DialogTitle>How many attempts?</DialogTitle>
          </div>
        </DialogHeader>
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          {ATTEMPT_TIERS.map(t => {
            const preview = computeChalk("boss_attempt", styles);
            const total = Math.round(preview.total * t.mult);
            return (
              <button key={t.v} onClick={() => commit("attempt", t.v)}
                className="rounded-xl border-2 border-[hsl(var(--panel-frame))] bg-secondary/50 p-4 text-left transition hover:border-[hsl(var(--btn-orange))] hover:ring-4 ring-[hsl(var(--btn-orange))]/30 active:translate-y-[2px]">
                <div className="text-base font-display font-bold">{t.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{t.desc}</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <img src={chalkBagImg} alt="" className="h-5 w-5" />
                  <span className="font-bold tabular-nums gradient-chalk-text">+{total}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end pt-3">
          <GameButton variant="ghost" size="sm" onClick={() => setStep("main")}>Back</GameButton>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          <HeaderImage src={bossImg} alt="Boss" ring="ring-2 ring-[hsl(var(--boss))]/50" />
          <DialogTitle>Log Boss Project</DialogTitle>
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
              <SelectContent>{availableSystems.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Grade">
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{grades.map(gr => <SelectItem key={gr} value={gr}>{gr}</SelectItem>)}</SelectContent>
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
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="So close. The crux is brutal." rows={2} />
        </Field>
      </div>

      <div className="flex justify-end gap-2 pt-3">
        <GameButton variant="ghost" size="sm" onClick={onBack}>Back</GameButton>
        <GameButton variant="primary" size="md" onClick={() => setStep("attempts")}>
          <Swords className="h-4 w-4" /> Attempted
        </GameButton>
        <GameButton variant="danger" size="md" onClick={() => commit("defeat")}>
          <Trophy className="h-4 w-4" /> Defeated Boss
        </GameButton>
      </div>
    </>
  );
}

// ===================== Helpers =====================

function PreviewReward({ preview }: { preview: ReturnType<typeof computeChalk> }) {
  return (
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
  );
}

function SimpleCelebrate({ total, label, image = boulderImg, alt = "Boulder" }: { total: number; label: string; image?: string; alt?: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto h-40 w-40 rounded-2xl overflow-hidden border-4 border-[hsl(var(--btn-orange))] shadow-[0_0_40px_hsl(var(--btn-orange)/0.55)] animate-banner-pop">
        <img src={image} alt={alt} className="h-full w-full object-cover" />
      </div>
      <div className="mt-5 menu-label">{label}</div>
      <div className="mt-2 flex items-center justify-center gap-3 animate-pop-in">
        <img src={chalkBagImg} alt="Chalk" className="h-12 w-12 object-contain drop-shadow-[0_4px_12px_hsl(var(--chalk-glow)/0.6)]" />
        <span className="text-4xl font-bold gradient-chalk-text tabular-nums">+{total}</span>
      </div>
      <Sparkles className="h-6 w-6 mx-auto mt-3 text-chalk-glow animate-pulse" />
    </div>
  );
}

function BossCelebrate({ total, breakdown, onDone }: { total: number; breakdown: ChalkBreakdown; onDone: () => void }) {
  const s = useGame();
  // Chalk impact particles — one-shot burst at impact (~0.65s into player charge).
  const particles = Array.from({ length: 18 });
  return (
    <div className="relative py-8 px-2 text-center overflow-hidden">
      {/* radial glow background */}
      <div className="pointer-events-none absolute inset-0 animate-fade-overlay"
        style={{ background: "radial-gradient(circle at center, hsl(var(--boss) / 0.3), transparent 65%)" }} />

      {/* Battle scene */}
      <div className="relative h-56 flex items-center justify-between px-6">
        {/* Player */}
        <div className="relative animate-player-charge">
          <div className="absolute -inset-3 rounded-full blur-2xl pointer-events-none animate-aura-pulse"
            style={{ background: "radial-gradient(circle, hsl(var(--legendary) / 0.85) 0%, transparent 65%)" }} />
          <div className="relative">
            <ClimberAvatar level={s.level} gender={s.gender} equipped={s.equipped} size="xl" glow />
          </div>
        </div>

        {/* Impact flash + chalk particles at center */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 rounded-full animate-impact-flash"
          style={{ background: "radial-gradient(circle, hsl(0 0% 100% / 0.95), transparent 70%)" }} />
        {particles.map((_, i) => {
          const angle = (i / particles.length) * Math.PI * 2 + Math.random() * 0.4;
          const dist = 90 + Math.random() * 80;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          return (
            <span key={i}
              className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-white animate-chalk-poof"
              style={{
                ["--dx" as any]: `${dx}px`,
                ["--dy" as any]: `${dy}px`,
                animationDelay: `${0.62 + Math.random() * 0.15}s`,
                animationDuration: "1s",
                animationFillMode: "forwards",
                boxShadow: "0 0 8px hsl(0 0% 100% / 0.8)",
              }} />
          );
        })}

        {/* Boss */}
        <div className="animate-boss-knockout">
          <div className="h-40 w-40 rounded-2xl overflow-hidden border-4 border-[hsl(var(--boss))] shadow-[0_0_40px_hsl(var(--boss)/0.6)]">
            <img src={bossImg} alt="Boss defeated" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>

      <div className="mt-2 font-display font-extrabold text-3xl uppercase tracking-wider animate-banner-pop"
        style={{ color: "hsl(var(--boss))", textShadow: "0 2px 0 hsl(0 0% 0% / 0.5)" }}>
        Boss Defeated!
      </div>

      {/* Chalk breakdown */}
      <div className="mt-5 mx-auto max-w-sm rounded-lg border border-border bg-secondary/50 p-3 text-left animate-pop-in"
        style={{ animationDelay: "1.4s", animationFillMode: "both" }}>
        <div className="flex items-center gap-2 mb-2">
          <img src={chalkBagImg} alt="Chalk" className="h-7 w-7 object-contain" />
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Chalk earned</span>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Base</span>
            <span className="tabular-nums">{breakdown.base}</span>
          </div>
          {breakdown.bonuses.map((b, i) => (
            <div key={i} className="flex justify-between gap-4">
              <span className="text-muted-foreground">+ {b.source}</span>
              <span className="tabular-nums text-chalk-glow">+{b.amount}</span>
            </div>
          ))}
          <div className="border-t border-border/60 pt-1.5 mt-1.5 flex justify-between gap-4 font-bold">
            <span>Total</span>
            <span className="tabular-nums gradient-chalk-text text-base">+{total}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center animate-pop-in" style={{ animationDelay: "1.6s", animationFillMode: "both" }}>
        <GameButton variant="primary" size="lg" onClick={onDone}>Keep Climbing</GameButton>
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
