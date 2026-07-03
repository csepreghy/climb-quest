import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameButton } from "@/components/ui/game-button";
import { ActivityType, BASE_CHALK, STYLES, Style } from "@/game/data";
import { computeChalk, logBoulder, updateLog, AttemptType, useGame, ChalkBreakdown, BoulderLog, playerCeiling, hasBossSendOnDate, logStrength, StrengthWorkout, StrengthSet, strengthLevelMult, strengthBossTargetReps, logStrengthBossRep, getStrengthBossProgress, STRENGTH_BOSS_TARGET, strengthBossTarget, setStrengthLevel, maxStrengthLevel, strengthKey, Boss, activeBossProjects, createBossProject, markBossSent, admitBossDefeat, expireOverdueBosses, MAX_ACTIVE_BOSSES, BOSS_DEADLINE_DAYS, BOSS_DEFEAT_PENALTY, bossExpiresAt, logStrengthHold, getHoldRecord, isHoldExercise, HOLD_BOSS_TARGET_SECONDS } from "@/game/store";
import { setLastUsedGym, gradeLabels, gradeToVRank, difficultyMultiplier, resolveGymGradingSystems } from "@/game/gyms";
import { useAllGymsForLogging as useGyms } from "@/game/allGyms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ArrowLeft, Info, Swords, Trophy, Dumbbell, Timer, ChevronDown, Skull, Plus, Clock, Flag } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import boulderImg from "@/assets/log-boulder.webp";
import pickBoulderImg from "@/assets/log-pick-boulder.webp";
import hangboardPickImg from "@/assets/log-hangboard.webp.asset.json";
import chalkBagImg from "@/assets/chalk-bag.png";
import bossImg from "@/assets/log-boss.webp";
import effortMediumImg from "@/assets/effort-medium.png.asset.json";
import effortHardImg from "@/assets/effort-hard.png.asset.json";
import strengthImg from "@/assets/log-strength.webp";
import strengthCoreImg from "@/assets/strength-core.webp";
import core1 from "@/assets/strength-core-1.webp";
import core2 from "@/assets/strength-core-2.webp";
import core3 from "@/assets/strength-core-3.webp";
import core4 from "@/assets/strength-core-4.webp";
import core5 from "@/assets/strength-core-5.webp";
import pullup1 from "@/assets/strength-pullup-1.webp";
import pullup2 from "@/assets/strength-pullup-2.webp";
import pullup3 from "@/assets/strength-pullup-3.webp";
import pullup4 from "@/assets/strength-pullup-4.webp";
import pullup5 from "@/assets/strength-pullup-5.webp";
import pullup6 from "@/assets/strength-pullup-6.webp";
import pushup1 from "@/assets/strength-pushup-1.webp";
import pushup2 from "@/assets/strength-pushup-2.webp";
import pushup3 from "@/assets/strength-pushup-3.webp";
import pushup4 from "@/assets/strength-pushup-4.webp";
import pushup5 from "@/assets/strength-pushup-5.webp";
import handstand1 from "@/assets/strength-handstand-1.webp";
import handstand2 from "@/assets/strength-handstand-2.webp";
import handstand3 from "@/assets/strength-handstand-3.webp";
import handstand4 from "@/assets/strength-handstand-4.webp";
import handstand5 from "@/assets/strength-handstand-5.webp";
import hspu1 from "@/assets/strength-handstand-pushup-1.webp";
import hspu2 from "@/assets/strength-handstand-pushup-2.webp";
import hspu3 from "@/assets/strength-handstand-pushup-3.webp";
import hspu4 from "@/assets/strength-handstand-pushup-4.webp";
import hspu5 from "@/assets/strength-handstand-pushup-5.webp";
import squat1 from "@/assets/strength-squat-1.webp";
import squat2 from "@/assets/strength-squat-2.webp";
import squat3 from "@/assets/strength-squat-3.webp";
import squat4 from "@/assets/strength-squat-4.webp";
import squat5 from "@/assets/strength-squat-5.webp";
import plank1 from "@/assets/strength-plank-1.webp";
import plank2 from "@/assets/strength-plank-2.webp";
import plank3 from "@/assets/strength-plank-3.webp";
import plank4 from "@/assets/strength-plank-4.webp";
import plank5 from "@/assets/strength-plank-5.webp";
import { getActivityReward } from "@/game/activityRewards";
import { PickCard } from "@/components/pixel/PickCard";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { BoardLogModal } from "@/components/board/BoardLogModal";
import boardMoonAsset from "@/assets/board-moonboard.png.asset.json";

type Mode = "pick" | "boulder-pick" | "form" | "strength" | "boss-pick" | "boss-new" | "boss-existing" | "board";
type InitialMode = "pick" | "boulder-pick" | "boulder" | "strength" | "board";
type Kind = "boulder" | "boss";

export function LogModal({ open, onOpenChange, editLog, initialMode, editBoardSession }: { open: boolean; onOpenChange: (v: boolean) => void; editLog?: BoulderLog | null; initialMode?: InitialMode; editBoardSession?: import("@/game/board/types").BoardSessionRow | null }) {
  const [mode, setMode] = useState<Mode>("pick");
  const [kind, setKind] = useState<Kind>("boulder");
  const [selectedBoss, setSelectedBoss] = useState<Boss | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      if (editBoardSession) {
        setMode("board");
      } else if (editLog) {
        setKind(editLog.isBoss ? "boss" : "boulder");
        setMode("form");
      } else {
        const im = initialMode ?? "pick";
        if (im === "boulder") { setKind("boulder"); setMode("form"); }
        else { setMode(im); }
        setSelectedBoss(null);
      }
    }
  }, [open, editLog, editBoardSession, initialMode]);

  function openBossFlow() {
    // Auto-resolve any expired bosses up-front so the user sees current state.
    const expired = expireOverdueBosses();
    if (expired.length > 0) {
      toast.error(`${expired.length} boss${expired.length === 1 ? "" : "es"} timed out — you lost ${expired.length * BOSS_DEFEAT_PENALTY} chalk.`);
    }
    setKind("boss");
    setMode("boss-pick");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {mode === "pick" ? (
          <>
            <DialogHeader>
              <DialogTitle>What are you logging?</DialogTitle>
            </DialogHeader>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
              <PickCard
                image={pickBoulderImg}
                title="Boulder"
                desc="Log a climb — single send, project, or boss battle."
                onClick={() => { setKind("boulder"); setMode("form"); }}
                ring="ring-[hsl(var(--btn-green))]/60"
              />

              <PickCard
                image={pullup4}
                title="Strength"
                desc="Core or pull-ups — track sets, reps, and rest."
                onClick={() => setMode("strength")}
                ring="ring-[hsl(var(--sky))]/60"
              />
              <PickCard
                image={hangboardPickImg.url}
                title="Hangboard"
                desc="Beastmaker workouts — hangs count toward your Strength Tier."
                onClick={() => { onOpenChange(false); navigate("/hangboard"); }}
                ring="ring-[hsl(270_80%_65%)]/60"
              />
              <PickCard
                image={boardMoonAsset.url}
                title="Board"
                desc="MoonBoard or Kilter — earn chalk based on your top grade."
                onClick={() => setMode("board")}
                ring="ring-[hsl(var(--epic))]/60"
              />
            </div>
          </>
        ) : mode === "strength" ? (
          <StrengthFlow onBack={() => setMode("pick")} onDone={() => onOpenChange(false)} />
        ) : mode === "board" ? (
          <BoardLogModal onBack={() => editBoardSession ? onOpenChange(false) : setMode("pick")} onDone={() => onOpenChange(false)} editSession={editBoardSession ?? null} />
        ) : mode === "boss-pick" ? (
          <BossPicker
            onBack={() => setMode("pick")}
            onPickExisting={(b) => { setSelectedBoss(b); setMode("boss-existing"); }}
            onPickNew={() => { setSelectedBoss(null); setMode("boss-new"); }}
            onSwitchToBoulder={() => { setKind("boulder"); setMode("form"); }}
          />
        ) : mode === "boss-existing" && selectedBoss ? (
          <BossForm
            onBack={() => setMode("boss-pick")}
            onDone={() => onOpenChange(false)}
            existingBoss={selectedBoss}
          />
        ) : mode === "boss-new" ? (
          <BossForm
            onBack={() => setMode("boss-pick")}
            onDone={() => onOpenChange(false)}
            onSwitchToBoulder={() => { setKind("boulder"); setMode("form"); }}
          />

        ) : kind === "boss" ? (
          <BossForm onBack={() => editLog ? onOpenChange(false) : setMode("pick")} onDone={() => onOpenChange(false)} editLog={editLog ?? null} onSwitchToBoulder={editLog ? undefined : () => { setKind("boulder"); setMode("form"); }} />
        ) : (
          <BoulderForm
            onBack={() => editLog ? onOpenChange(false) : setMode("pick")}
            onDone={() => onOpenChange(false)}
            onSwitchToBoss={openBossFlow}
            editLog={editLog ?? null}
          />
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

// ===================== KIND TOGGLE =====================

function KindToggle({ kind, onChange }: { kind: "boulder" | "boss"; onChange: (k: "boulder" | "boss") => void }) {
  const opts = [
    { v: "boulder" as const, label: "Boulder", img: boulderImg, ring: "ring-[hsl(197_100%_42%)]" },
    { v: "boss" as const, label: "Boss Project", img: bossImg, ring: "ring-[hsl(var(--boss))]" },
  ];
  return (
    <div className="flex gap-3 w-full px-1 pt-1">
      {opts.map(o => {
        const active = kind === o.v;
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "relative rounded-xl p-1 transition flex-1 sm:flex-none",
              active ? `ring-4 ${o.ring}` : "ring-2 ring-[hsl(var(--panel-frame))] opacity-70 hover:opacity-100",
            )}
          >
            <div className="relative overflow-hidden rounded-xl bg-black/60">
              <div className="aspect-square w-full sm:w-[180px]">
                <img src={o.img} alt={o.label} className="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 py-1.5 text-center text-sm font-bold">
                {o.label}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


// ===================== BOULDER FORM =====================

function BoulderForm({ onBack, onDone, onSwitchToBoss, editLog }: { onBack: () => void; onDone: () => void; onSwitchToBoss?: () => void; editLog?: BoulderLog | null }) {
  const gymState = useGyms();
  const initialGymId = editLog?.gymId
    ?? gymState.lastUsedGymId
    ?? gymState.gyms.find(g => g.primary)?.id
    ?? gymState.gyms[0]?.id
    ?? "";
  const [gymId, setGymId] = useState(initialGymId);
  const gym = gymState.gyms.find(g => g.id === gymId) ?? null;

  const availableSystems = gym
    ? resolveGymGradingSystems(gym, gymState.gradingSystems)
    : gymState.gradingSystems;
  const defaultGsId = availableSystems[0]?.id ?? "v_grades";
  const [gsId, setGsId] = useState(defaultGsId);
  useEffect(() => { setGsId(availableSystems[0]?.id ?? "v_grades"); }, [gymId]);
  // Resolve only against this gym's available systems — never fall back to
  // a system from another gym (e.g. Urban Boulders should never show
  // Boulderlounge's custom grading).
  const gs = availableSystems.find(g => g.id === gsId) ?? availableSystems[0];
  const grades = gs ? gradeLabels(gs) : [];
  const gradeHex = (label: string) => gs?.kind === "color" ? gs.colors?.find(c => c.name === label)?.hex : undefined;
  const renderGradeItem = (gr: string) => {
    const hex = gradeHex(gr);
    return (
      <SelectItem key={gr} value={gr}>
        {hex ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-full border border-[hsl(var(--panel-frame))]" style={{ background: hex }} />
            {gr}
          </span>
        ) : gr}
      </SelectItem>
    );
  };

  const [date, setDate] = useState(() => (editLog?.date ?? new Date().toISOString()).slice(0, 10));
  const [holdColorId, setHoldColorId] = useState<string>(editLog?.holdColorId ?? "");
  const [grade, setGrade] = useState(editLog?.grade ?? grades[0] ?? "V3");
  const [gradeMax, setGradeMax] = useState<string>(editLog?.gradeMax ?? "");
  const [useRange, setUseRange] = useState(!!editLog?.gradeMax);
  useEffect(() => { if (grades.length && !grades.includes(grade)) setGrade(grades[0]); }, [grades.join("|")]);

  const [activity, setActivity] = useState<Extract<ActivityType, "warmup_boulder" | "boulder" | "hard_boulder" | "project_boulder"> | null>(
    (editLog?.activity as any) ?? null
  );
  const [attemptType, setAttemptType] = useState<AttemptType | null>(editLog?.attemptType ?? null);
  const [step, setStep] = useState<"main" | "effort">("main");
  const [styles, setStyles] = useState<Style[]>(editLog?.styles ?? []);
  const [notes, setNotes] = useState(editLog?.notes ?? "");
  const [celebrating, setCelebrating] = useState<{ total: number; critPre: number | null } | null>(null);
  const [projectPromptOpen, setProjectPromptOpen] = useState(false);

  const sent = attemptType === "flash" || attemptType === "send";
  const flashed = attemptType === "flash";
  const repeat = attemptType === "repeat";
  const gameState = useGame();
  const ceiling = playerCeiling(gameState);
  const diffMult = useMemo(
    () => difficultyMultiplier(gradeToVRank(grade, gs), ceiling),
    [grade, gs, ceiling],
  );
  const preview = useMemo(
    () => (activity && attemptType)
      ? computeChalk(activity, styles, sent, flashed, diffMult, undefined, repeat)
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity, attemptType, styles.join(","), diffMult],
  );

  function toggleStyle(st: Style) {
    setStyles(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  }

  function submit() {
    if (!activity || !attemptType) {
      toast.error("Pick an effort and attempt first");
      return;
    }
    if (attemptType === "project" && !editLog) {
      setProjectPromptOpen(true);
      return;
    }
    if (gymId) setLastUsedGym(gymId);
    const holdColor = gym?.holdColors.find(c => c.id === holdColorId);
    const locationStr = [gym?.name, holdColor?.name && `${holdColor.name} hold`].filter(Boolean).join(" · ");
    const input = {
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
      difficultyMult: diffMult,
    };
    if (editLog) {
      updateLog(editLog.id, input);
      toast.success("Log updated");
      onDone();
      return;
    }
    const res = logBoulder(input);
    setCelebrating({ total: res.log.chalkTotal, critPre: findCritPre(res.breakdown) });
    toast.success(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />+{res.log.chalkTotal} Chalk earned</div>);
    setTimeout(() => { setCelebrating(null); onDone(); }, 1600);
  }

  if (celebrating) return <SimpleCelebrate total={celebrating.total} label="Sent it!" critPre={celebrating.critPre} />;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          <HeaderImage src={boulderImg} alt="Boulder" ring="ring-2 ring-[hsl(var(--btn-green))]/40" />
          <DialogTitle>Log Boulder</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2 pt-1 pb-2">
        {step === "main" ? (
          <>
            {!editLog && onSwitchToBoss && (
              <KindToggle kind="boulder" onChange={(k) => { if (k === "boss") onSwitchToBoss(); }} />
            )}
            {gymState.gyms.length === 0 && (
              <div className="text-xs rounded-md border border-border bg-secondary/40 px-3 py-2 text-muted-foreground">
                No gyms set up yet — you can still log this climb. <a href="/gym" className="font-semibold text-foreground underline underline-offset-2">Add a gym</a> to track hold colors and your gym's grading.
              </div>
            )}
            <div className="space-y-3">
              <Field label="Date">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gym">
                  <Select value={gymId} onValueChange={setGymId} disabled={gymState.gyms.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Pick a gym" /></SelectTrigger>
                    <SelectContent>{gymState.gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}{g.primary ? " ★" : ""}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="space-y-3">
                  <Field label={useRange ? "Grade (min)" : "Grade"}>
                    <div className="flex gap-2">
                      <Select value={grade} onValueChange={setGrade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{grades.map(renderGradeItem)}</SelectContent>
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
                        <SelectContent>{grades.map(renderGradeItem)}</SelectContent>
                      </Select>
                    </Field>
                  )}
                </div>
              </div>
              <Field label="Hold color">
                {gym && gym.holdColors.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {gym.holdColors.map(c => (
                      <button key={c.id} type="button" onClick={() => setHoldColorId(c.id === holdColorId ? "" : c.id)}
                        title={c.name}
                        className={cn("h-8 w-8 rounded-full border-2 transition",
                          holdColorId === c.id ? "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40" : "border-[hsl(var(--panel-frame))] hover:border-[hsl(var(--btn-orange))]")}
                        style={{ background: c.hex2 ? `linear-gradient(90deg, ${c.hex} 0 50%, ${c.hex2} 50% 100%)` : c.hex }} />
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">Add hold colors in My Gym.</div>
                )}
              </Field>
            </div>

            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-left">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground pointer-events-none">Style</Label>
                {styles.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{styles.length} selected</span>
                )}
                <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STYLES.map(st => {
                    const on = styles.includes(st);
                    return (
                      <button key={st} type="button" onClick={() => toggleStyle(st)}
                        className={cn("text-xs px-2.5 py-1 rounded-full border-2 capitalize transition",
                          on
                            ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15 text-foreground"
                            : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground")}>
                        {st}
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Field label="Notes">
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Beta unlocked. Tried not to scream." rows={2} />
            </Field>
          </>
        ) : (
          <>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Effort</Label>
              <p className="text-[11px] text-muted-foreground mt-1 mb-2 italic">This is not about how hard the boulder is, but how hard it was for you.</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "warmup_boulder" as const, label: "Easy", desc: "Low effort, I can do this back to back several times", img: boulderImg },
                  { v: "boulder" as const, label: "Medium", desc: "Had to try harder, but I didn't have to put in 100%", img: effortMediumImg.url },
                  { v: "hard_boulder" as const, label: "Hard", desc: "Took quite some effort, could have fallen in a few places", img: effortHardImg.url },
                ]).map(o => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setActivity(o.v)}
                    className={cn(
                      "rounded-lg overflow-hidden border-2 transition text-left flex flex-col",
                      activity === o.v
                        ? "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40 bg-[hsl(var(--btn-orange))]/10"
                        : "border-border bg-secondary/40 hover:border-[hsl(var(--btn-orange))]/60"
                    )}
                  >
                    <div className="aspect-square w-full overflow-hidden bg-black/30">
                      <img src={o.img} alt={o.label} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-2 space-y-1">
                      <div className="text-sm font-bold">{o.label}</div>
                      <div className="text-[10px] leading-tight text-muted-foreground">{o.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Attempt</Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { v: "flash", label: "Flash ⚡", desc: "First try" },
                  { v: "send", label: "Send 🏆", desc: "Multi-try, 1 sesh" },
                  { v: "repeat", label: "Repeat 🔁", desc: "Done it before" },
                  { v: "project", label: "Project 🎯", desc: "Multi-session" },
                ] as { v: AttemptType; label: string; desc: string }[]).map(o => (
                  <button key={o.v} type="button"
                    onClick={() => {
                      setAttemptType(o.v);
                      if (o.v === "project" && !editLog && onSwitchToBoss) {
                        setProjectPromptOpen(true);
                      }
                    }}
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

            {preview && <PreviewReward preview={preview} />}
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {step === "main" ? (
          <>
            <GameButton variant="ghost" size="sm" onClick={onBack}>{editLog ? "Cancel" : "Back"}</GameButton>
            <GameButton variant="success" size="md" onClick={() => setStep("effort")}>{editLog ? "Next" : "Next"}</GameButton>
          </>
        ) : (
          <>
            <GameButton variant="ghost" size="sm" onClick={() => setStep("main")}>Back</GameButton>
            <GameButton variant="success" size="md" onClick={submit} disabled={!activity || !attemptType}>
              {editLog ? "Save changes" : "Send it"}
            </GameButton>
          </>
        )}
      </div>


      <Dialog open={projectPromptOpen} onOpenChange={(o) => { setProjectPromptOpen(o); if (!o) setAttemptType(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Log this as a Boss Project?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 pt-1">
            <div className="h-44 w-44 rounded-2xl overflow-hidden border-4 border-[hsl(var(--boss))] shadow-[0_0_36px_hsl(var(--boss)/0.55)]">
              <img src={bossImg} alt="Boss" className="h-full w-full object-cover" />
            </div>
            <DialogDescription className="text-center px-2">
              Multi-session climbs should be logged as Boss Projects — you'll get richer tracking and bigger rewards when you finally send it.
            </DialogDescription>
          </div>
          <div className="flex flex-col gap-2 pt-2 w-full">
            <GameButton variant="primary" size="md" className="w-full" onClick={() => { setProjectPromptOpen(false); onSwitchToBoss?.(); }}>
              Yes, log as Boss Project
            </GameButton>
            <GameButton variant="ghost" size="sm" className="w-full" onClick={() => { setProjectPromptOpen(false); setAttemptType(null); }}>
              No, it's just a boulder
            </GameButton>
          </div>
        </DialogContent>
      </Dialog>
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

function BossForm({ onBack, onDone, editLog, existingBoss, onSwitchToBoulder }: { onBack: () => void; onDone: () => void; editLog?: BoulderLog | null; existingBoss?: Boss | null; onSwitchToBoulder?: () => void }) {
  const gymState = useGyms();
  const lockedFields = !!existingBoss; // when attacking an existing boss, fields are read-only
  const initialGymId = existingBoss?.gymId
    ?? editLog?.gymId
    ?? gymState.lastUsedGymId
    ?? gymState.gyms.find(g => g.primary)?.id
    ?? gymState.gyms[0]?.id
    ?? "";
  const [gymId, setGymId] = useState(initialGymId);
  const gym = gymState.gyms.find(g => g.id === gymId) ?? null;

  const availableSystems = gym
    ? resolveGymGradingSystems(gym, gymState.gradingSystems)
    : gymState.gradingSystems;
  const [gsId, setGsId] = useState(availableSystems[0]?.id ?? "v_grades");
  useEffect(() => { setGsId(availableSystems[0]?.id ?? "v_grades"); }, [gymId]);
  const gs = availableSystems.find(g => g.id === gsId) ?? availableSystems[0];
  const grades = gs ? gradeLabels(gs) : [];
  const gradeHex = (label: string) => gs?.kind === "color" ? gs.colors?.find(c => c.name === label)?.hex : undefined;
  const renderGradeItem = (gr: string) => {
    const hex = gradeHex(gr);
    return (
      <SelectItem key={gr} value={gr}>
        {hex ? (
          <span className="flex items-center gap-2">
            <span className="inline-block h-3.5 w-3.5 rounded-full border border-[hsl(var(--panel-frame))]" style={{ background: hex }} />
            {gr}
          </span>
        ) : gr}
      </SelectItem>
    );
  };

  const [date, setDate] = useState(() => (editLog?.date ?? new Date().toISOString()).slice(0, 10));
  const [holdColorId, setHoldColorId] = useState<string>(existingBoss?.holdColorId ?? editLog?.holdColorId ?? "");
  const [grade, setGrade] = useState(existingBoss?.grade ?? editLog?.grade ?? grades[0] ?? "V5");
  useEffect(() => { if (!lockedFields && grades.length && !grades.includes(grade)) setGrade(grades[0]); }, [grades.join("|")]);
  const [styles, setStyles] = useState<Style[]>(existingBoss?.styles ?? editLog?.styles ?? []);
  const [notes, setNotes] = useState(editLog?.notes ?? "");
  
  const [admitOpen, setAdmitOpen] = useState(false);

  const [step, setStep] = useState<BossStep>("main");
  const [celebrate, setCelebrate] = useState<{ total: number; defeated: boolean; breakdown: ReturnType<typeof computeChalk> } | null>(null);

  function toggleStyle(st: Style) {
    if (lockedFields) return;
    setStyles(prev => prev.includes(st) ? prev.filter(x => x !== st) : [...prev, st]);
  }

  function commit(outcome: "attempt" | "defeat", attemptTier?: AttemptTier) {
    const dateISO = new Date(date).toISOString();
    if (gymId) setLastUsedGym(gymId);
    const holdColor = gym?.holdColors.find(c => c.id === holdColorId);
    const locationStr = [gym?.name, holdColor?.name && `${holdColor.name} hold`].filter(Boolean).join(" · ");
    const activity: ActivityType = outcome === "defeat" ? "boss_send" : "boss_attempt";
    const mult = outcome === "attempt" ? (ATTEMPT_TIERS.find(t => t.v === attemptTier)?.mult ?? 1) : 1;

    // Resolve target boss id: existing boss, or create a new boss project.
    let bossId = existingBoss?.id;
    if (!editLog && !bossId) {
      if (activeBossProjects().length >= MAX_ACTIVE_BOSSES) {
        toast.error(`You can only have ${MAX_ACTIVE_BOSSES} active boss projects at once. Defeat or admit defeat on one first.`);
        return;
      }
      const created = createBossProject({
        grade, styles, gymId: gymId || undefined, holdColorId: holdColorId || undefined,
        notes: notes || undefined,
      });
      if (!created.ok) { toast.error(created.reason ?? "Could not create boss"); return; }
      bossId = created.boss.id;
    }

    const input = {
      activity,
      date: dateISO,
      location: locationStr || undefined,
      grade,
      styles,
      sent: outcome === "defeat",
      notes: outcome === "attempt" && attemptTier ? `${attemptTier} attempts${notes ? " · " + notes : ""}` : notes,
      isBoss: true,
      attemptType: (outcome === "defeat" ? "send" : "project") as AttemptType,
      holdColorId: holdColorId || undefined,
      gymId: gymId || undefined,
      bossId,
      chalkMultiplier: mult,
    };
    if (editLog) {
      updateLog(editLog.id, input);
      toast.success("Log updated");
      onDone();
      return;
    }
    const res = logBoulder(input);
    if (outcome === "defeat" && bossId) markBossSent(bossId);
    const breakdown = computeChalk(activity, styles, outcome === "defeat", false);
    const scaled: ReturnType<typeof computeChalk> = {
      base: Math.round(breakdown.base * mult),
      bonuses: breakdown.bonuses.map(b => ({ ...b, amount: Math.round(b.amount * mult) })),
      total: res.log.chalkTotal,
    };
    setCelebrate({ total: res.log.chalkTotal, defeated: outcome === "defeat", breakdown: scaled });
    toast.success(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />+{res.log.chalkTotal} Chalk earned</div>);
    if (outcome !== "defeat") {
      setTimeout(() => { setCelebrate(null); onDone(); }, 1600);
    }
  }

  function handleAdmitDefeat() {
    if (!existingBoss) return;
    admitBossDefeat(existingBoss.id);
    toast.error(`Boss won. You lost ${BOSS_DEFEAT_PENALTY} chalk.`);
    setAdmitOpen(false);
    onDone();
  }

  if (celebrate) {
    return celebrate.defeated
      ? <BossCelebrate total={celebrate.total} breakdown={celebrate.breakdown} onDone={() => { setCelebrate(null); onDone(); }} />
      : <SimpleCelebrate total={celebrate.total} label="Logged attempt!" image={bossImg} alt="Boss" critPre={findCritPre(celebrate.breakdown)} />;
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

  const holdColor = gym?.holdColors.find(c => c.id === holdColorId) ?? null;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          <HeaderImage src={bossImg} alt="Boss" ring="ring-2 ring-[hsl(var(--boss))]/50" />
          <DialogTitle>{existingBoss ? "Boss Project" : "Log Boss Project"}</DialogTitle>
        </div>
      </DialogHeader>

      <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2 pt-1 pb-2">
        {onSwitchToBoulder && !existingBoss && !editLog && (
          <KindToggle kind="boss" onChange={(k) => { if (k === "boulder") onSwitchToBoulder(); }} />
        )}
        {existingBoss && (
          <BossSummary boss={existingBoss} gymName={gym?.name} holdColorHex={holdColor?.hex} holdColorHex2={holdColor?.hex2} holdColorName={holdColor?.name} />
        )}

        <div className="space-y-3">
          <Field label="Date">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          {!lockedFields && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gym">
                <Select value={gymId} onValueChange={setGymId} disabled={gymState.gyms.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Pick a gym" /></SelectTrigger>
                  <SelectContent>{gymState.gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}{g.primary ? " ★" : ""}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Grade">
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{grades.map(renderGradeItem)}</SelectContent>
                </Select>
              </Field>
            </div>
          )}
          {!lockedFields && (
            <Field label="Grading system">
              <Select value={gsId} onValueChange={setGsId} disabled={availableSystems.length <= 1}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{availableSystems.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          )}
          {!lockedFields && (
            <Field label="Hold color">
              {gym && gym.holdColors.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {gym.holdColors.map(c => (
                    <button key={c.id} type="button" onClick={() => setHoldColorId(c.id === holdColorId ? "" : c.id)}
                      title={c.name}
                      className={cn("h-8 w-8 rounded-full border-2 transition",
                        holdColorId === c.id ? "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40" : "border-[hsl(var(--panel-frame))] hover:border-[hsl(var(--btn-orange))]")}
                      style={{ background: c.hex2 ? `linear-gradient(90deg, ${c.hex} 0 50%, ${c.hex2} 50% 100%)` : c.hex }} />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">Add hold colors in My Gym.</div>
              )}
            </Field>
          )}
        </div>

        {!lockedFields && (
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 py-2 text-left">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground pointer-events-none">Style</Label>
              {styles.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{styles.length} selected</span>
              )}
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STYLES.map(st => (
                  <button key={st} type="button" onClick={() => toggleStyle(st)}
                    className={cn("text-xs px-2.5 py-1 rounded-full border-2 capitalize transition",
                      styles.includes(st)
                        ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15 text-foreground"
                        : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground")}>
                    {st}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Field label="Notes">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="So close. The crux is brutal." rows={2} />
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-3">
        <GameButton variant="ghost" size="sm" onClick={onBack}>{editLog ? "Cancel" : "Back"}</GameButton>
        {existingBoss && (
          <GameButton variant="ghost" size="sm" onClick={() => setAdmitOpen(true)}>
            <Flag className="h-4 w-4" /> Admit defeat
          </GameButton>
        )}
        {editLog ? (
          <GameButton variant="success" size="md" onClick={() => commit(editLog.attemptType === "send" || editLog.attemptType === "flash" ? "defeat" : "attempt")}>
            Save changes
          </GameButton>
        ) : (
          <>
            <GameButton variant="primary" size="md" onClick={() => setStep("attempts")}>
              <Swords className="h-4 w-4" /> Attempted
            </GameButton>
            <GameButton variant="danger" size="md" onClick={() => commit("defeat")}>
              <Trophy className="h-4 w-4" /> Defeated Boss
            </GameButton>
          </>
        )}
      </div>

      <Dialog open={admitOpen} onOpenChange={setAdmitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Admit defeat?</DialogTitle>
            <DialogDescription>
              The boss wins. You'll lose <strong>{BOSS_DEFEAT_PENALTY} chalk</strong> and this project will be retired.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <GameButton variant="ghost" size="sm" onClick={() => setAdmitOpen(false)}>Cancel</GameButton>
            <GameButton variant="danger" size="md" onClick={handleAdmitDefeat}>Admit defeat</GameButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== BOSS PICKER =====================

function formatBossTimeLeft(b: Boss): { label: string; severity: "ok" | "warn" | "crit" } {
  const ms = bossExpiresAt(b) - Date.now();
  if (ms <= 0) return { label: "Time's up", severity: "crit" };
  const days = Math.ceil(ms / 86400000);
  if (days <= 7) return { label: `${days}d left`, severity: "crit" };
  if (days <= 21) return { label: `${days}d left`, severity: "warn" };
  if (days < 60) return { label: `${days}d left`, severity: "ok" };
  const months = Math.round(days / 30);
  return { label: `~${months}mo left`, severity: "ok" };
}

function BossSummary({ boss, gymName, holdColorHex, holdColorHex2, holdColorName }: { boss: Boss; gymName?: string; holdColorHex?: string; holdColorHex2?: string; holdColorName?: string }) {
  const tl = formatBossTimeLeft(boss);
  const sevClass = tl.severity === "crit" ? "text-[hsl(var(--boss))]" : tl.severity === "warn" ? "text-[hsl(var(--btn-orange))]" : "text-muted-foreground";
  return (
    <div className="rounded-lg border-2 border-[hsl(var(--boss))]/40 bg-secondary/40 p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {holdColorHex && (
            <span
              className="inline-block h-9 w-9 rounded-full border-2 border-border shrink-0"
              style={{ background: holdColorHex2 ? `linear-gradient(90deg, ${holdColorHex} 0 50%, ${holdColorHex2} 50% 100%)` : holdColorHex }}
              aria-label={holdColorName}
            />
          )}
          <div className="min-w-0">
            <div className="font-display font-bold text-xl leading-none">{boss.grade}</div>
            {holdColorName && <div className="text-xs text-muted-foreground mt-1 truncate">{holdColorName}{gymName ? ` · ${gymName}` : ""}</div>}
            {!holdColorName && gymName && <div className="text-xs text-muted-foreground mt-1 truncate">{gymName}</div>}
          </div>
        </div>
        <div className={cn("text-xs flex items-center gap-1 font-bold shrink-0", sevClass)}>
          <Clock className="h-3.5 w-3.5" /> {tl.label}
        </div>
      </div>
      {(boss.styles?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1">
          {boss.styles!.map(s => (
            <span key={s} className="text-[10px] capitalize px-2 py-0.5 rounded-full border border-border bg-background/60">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BossPicker({ onBack, onPickExisting, onPickNew, onSwitchToBoulder }: { onBack: () => void; onPickExisting: (b: Boss) => void; onPickNew: () => void; onSwitchToBoulder?: () => void }) {
  const s = useGame();
  const gymState = useGyms();
  const active = activeBossProjects(s);
  const atCap = active.length >= MAX_ACTIVE_BOSSES;
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          <HeaderImage src={bossImg} alt="Boss" ring="ring-2 ring-[hsl(var(--boss))]/50" />
          <DialogTitle>Boss Projects</DialogTitle>
        </div>
        <DialogDescription>
          Keep track of up to {MAX_ACTIVE_BOSSES} boss projects. Each one gives you {BOSS_DEADLINE_DAYS} day to defeat.
        </DialogDescription>
      </DialogHeader>

      {onSwitchToBoulder && (
        <div className="pt-2">
          <KindToggle kind="boss" onChange={(k) => { if (k === "boulder") onSwitchToBoulder(); }} />
        </div>
      )}


      <div className="space-y-3 max-h-[70vh] overflow-y-auto overflow-x-hidden pr-1">
        {active.length === 0 && (
          <div className="text-sm text-muted-foreground italic px-1">
            No active boss projects yet. Pick a nemesis below.
          </div>
        )}
        {active.map(b => {
          const gym = gymState.gyms.find(g => g.id === b.gymId);
          const holdColor = gym?.holdColors.find(c => c.id === b.holdColorId);
          const tl = formatBossTimeLeft(b);
          const sevClass = tl.severity === "crit" ? "text-[hsl(var(--boss))]" : tl.severity === "warn" ? "text-[hsl(var(--btn-orange))]" : "text-muted-foreground";
          return (
            <button
              key={b.id}
              onClick={() => onPickExisting(b)}
              className="w-full text-left rounded-xl border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-3 transition hover:border-[hsl(var(--boss))] hover:ring-2 ring-[hsl(var(--boss))]/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {holdColor && (
                    <span
                      className="inline-block h-9 w-9 rounded-full border-2 border-border shrink-0"
                      style={{ background: holdColor.hex2 ? `linear-gradient(90deg, ${holdColor.hex} 0 50%, ${holdColor.hex2} 50% 100%)` : holdColor.hex }}
                      aria-label={holdColor.name}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-display font-bold text-xl leading-none">{b.grade}</div>
                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      {holdColor?.name}
                      {holdColor && gym ? " · " : ""}
                      {gym?.name}
                    </div>
                  </div>
                </div>
                <div className={cn("text-xs flex items-center gap-1 font-bold shrink-0", sevClass)}>
                  <Clock className="h-3.5 w-3.5" /> {tl.label}
                </div>
              </div>
              {(b.styles?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {b.styles!.map(s => (
                    <span key={s} className="text-[10px] capitalize px-2 py-0.5 rounded-full border border-border bg-background/60">{s}</span>
                  ))}
                </div>
              )}
              {(() => {
                const sessionCount = (b.attempts?.length ?? 0) + s.logs.filter(l => l.bossId === b.id).length;
                return (
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {sessionCount > 0 ? `${sessionCount} session${sessionCount === 1 ? "" : "s"}` : "No sessions yet"}
                  </div>
                );
              })()}
            </button>
          );
        })}

        <button
          onClick={onPickNew}
          disabled={atCap}
          className={cn(
            "w-full text-left rounded-xl border-2 border-dashed border-[hsl(var(--panel-frame))] bg-secondary/20 p-3 transition",
            atCap ? "opacity-50 cursor-not-allowed" : "hover:border-[hsl(var(--btn-green))] hover:bg-secondary/40"
          )}
          title={atCap ? `Defeat or admit defeat on a boss to make room (max ${MAX_ACTIVE_BOSSES}).` : undefined}
        >
          <div className="flex items-center gap-2 font-display font-bold">
            <Plus className="h-4 w-4" /> Log a new boss project
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {atCap
              ? `You're at the ${MAX_ACTIVE_BOSSES}-boss cap. Send or retire one first.`
              : `${MAX_ACTIVE_BOSSES - active.length} slot${MAX_ACTIVE_BOSSES - active.length === 1 ? "" : "s"} left.`}
          </div>
        </button>
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

function findCritPre(breakdown?: { bonuses: { source: string; amount: number }[] }): number | null {
  if (!breakdown) return null;
  const crit = breakdown.bonuses.find(b => b.source.startsWith("Crit!"));
  return crit ? crit.amount : null;
}

function SimpleCelebrate({ total, label, image = boulderImg, alt = "Boulder", critPre }: { total: number; label: string; image?: string; alt?: string; critPre?: number | null }) {
  const hasCrit = typeof critPre === "number" && critPre > 0;
  return (
    <div className="py-10 text-center">
      <div className="mx-auto h-40 w-40 rounded-2xl overflow-hidden border-4 border-[hsl(var(--btn-orange))] shadow-[0_0_40px_hsl(var(--btn-orange)/0.55)] animate-banner-pop">
        <img src={image} alt={alt} className="h-full w-full object-cover" />
      </div>
      <div className="mt-5 menu-label">{label}</div>
      {hasCrit && (
        <div className="mt-3 flex items-center justify-center gap-2 animate-pop-in">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[hsl(var(--epic))]/20 text-[hsl(var(--epic))] border border-[hsl(var(--epic))]/40">
            💥 Crit!
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground/80">
            {critPre} × 2 = <span className="gradient-chalk-text">{critPre! * 2}</span>
          </span>
        </div>
      )}
      <div className="mt-2 flex items-center justify-center gap-3 animate-pop-in">
        <img src={chalkBagImg} alt="Chalk" className="h-12 w-12 object-contain drop-shadow-[0_4px_12px_hsl(var(--chalk-glow)/0.6)]" />
        <span className="text-4xl font-bold gradient-chalk-text tabular-nums">+{total}</span>
      </div>
    </div>
  );
}

function BossCelebrate({ total, breakdown, onDone }: { total: number; breakdown: ChalkBreakdown; onDone: () => void }) {
  const s = useGame();
  // Chalk impact particles — one-shot burst exactly when cards collide (~0.72s into 1.1s charge).
  const particles = Array.from({ length: 110 });
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
          const angle = (i / particles.length) * Math.PI * 2 + Math.random() * 0.5;
          const burst = 30 + Math.random() * 60;
          const dx = Math.cos(angle) * burst;
          // Bias vertical motion downward so particles drift/fall after the burst.
          const dy = Math.sin(angle) * burst * 0.4 + 80 + Math.random() * 100;
          const size = 3 + Math.random() * 3;
          return (
            <span key={i}
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full bg-white animate-chalk-poof"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                ["--dx" as any]: `${dx}px`,
                ["--dy" as any]: `${dy}px`,
                animationDelay: `${0.72 + Math.random() * 0.06}s`,
                animationDuration: `${1.8 + Math.random() * 0.6}s`,
                animationTimingFunction: "cubic-bezier(0.22, 0.6, 0.4, 1)",
                animationFillMode: "forwards",
                boxShadow: "0 0 4px hsl(0 0% 100% / 0.7)",
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

// ===================== STRENGTH FLOW =====================

const REST_OPTIONS = [1, 2, 3, 5]; // minutes
const CORE_LEVEL_IMAGES: Record<number, string> = { 1: core1, 2: core2, 3: core3, 4: core4, 5: core5 };
const PULLUP_LEVEL_IMAGES: Record<number, string> = { 1: pullup1, 2: pullup2, 3: pullup3, 4: pullup4, 5: pullup5, 6: pullup6 };
const PUSHUP_LEVEL_IMAGES: Record<number, string> = { 1: pushup1, 2: pushup2, 3: pushup3, 4: pushup4, 5: pushup5 };
const HANDSTAND_HOLD_IMAGES: Record<number, string> = { 1: handstand1, 2: handstand2, 3: handstand3, 4: handstand4, 5: handstand5 };
const HANDSTAND_PUSHUP_IMAGES: Record<number, string> = { 1: hspu1, 2: hspu2, 3: hspu3, 4: hspu4, 5: hspu5 };
const SQUAT_LEVEL_IMAGES: Record<number, string> = { 1: squat1, 2: squat2, 3: squat3, 4: squat4, 5: squat5 };
const PLANK_LEVEL_IMAGES: Record<number, string> = { 1: plank1, 2: plank2, 3: plank3, 4: plank4, 5: plank5 };

const CORE_LEVEL_NAMES: Record<number, string> = {
  1: "Leg Raises",
  2: "Bent Leg Raises",
  3: "L-Sit Raises",
  4: "Tuck Raises",
  5: "Front Lever Raises",
};

const PULLUP_LEVEL_NAMES: Record<number, string> = {
  1: "Bend-Assisted",
  2: "Negative",
  3: "Regular",
  4: "~10-20% Bodyweight",
  5: "~40-60% Bodyweight",
  6: "One-Arm",
};

const PUSHUP_LEVEL_NAMES: Record<number, string> = {
  1: "On Knees",
  2: "Regular",
  3: "Diamond",
  4: "Archer",
  5: "1-Arm",
};

const HANDSTAND_HOLD_NAMES: Record<number, string> = {
  1: "Downward Dog",
  2: "Pike on Box",
  3: "Wall Handstand",
  4: "Free Handstand",
  5: "One-Arm Handstand",
};
const HANDSTAND_PUSHUP_NAMES: Record<number, string> = {
  1: "Pike Pushup",
  2: "Box Pike Pushup",
  3: "Wall Handstand Pushup",
  4: "Handstand Pushup",
  5: "90 Degree Pushup",
};

const SQUAT_LEVEL_NAMES: Record<number, string> = {
  1: "Assisted",
  2: "Regular",
  3: "Weighted",
  4: "Pistol",
  5: "Shrimp",
};

const PLANK_LEVEL_NAMES: Record<number, string> = {
  1: "Basic Plank",
  2: "Full Plank",
  3: "1 Arm",
  4: "1 Arm, 1 Foot",
  5: "90 Degree Hold",
};



// Seconds buckets used by handstand (hold) sets (instead of reps).
// Stored as the bucket index 1..4 in StrengthSet.reps.
const HANDSTAND_SECOND_BUCKETS: { idx: number; label: string }[] = [
  { idx: 1, label: "1-10s" },
  { idx: 2, label: "11-30s" },
  { idx: 3, label: "31-60s" },
  { idx: 4, label: "60+ s" },
];
function handstandBucketLabel(idx: number): string {
  return HANDSTAND_SECOND_BUCKETS.find(b => b.idx === idx)?.label ?? `${idx}`;
}

function workoutLevelName(workout: StrengthWorkout, level: number, mode?: "hold" | "pushup"): string {
  if (workout === "core") return CORE_LEVEL_NAMES[level] ?? `LEVEL ${level}`;
  if (workout === "pullup") return PULLUP_LEVEL_NAMES[level] ?? `LEVEL ${level}`;
  if (workout === "pushup") return PUSHUP_LEVEL_NAMES[level] ?? `LEVEL ${level}`;
  if (workout === "handstand") {
    const map = mode === "pushup" ? HANDSTAND_PUSHUP_NAMES : HANDSTAND_HOLD_NAMES;
    return map[level] ?? `LEVEL ${level}`;
  }
  if (workout === "squat") return SQUAT_LEVEL_NAMES[level] ?? `LEVEL ${level}`;
  if (workout === "plank") return PLANK_LEVEL_NAMES[level] ?? `LEVEL ${level}`;
  return `LEVEL ${level}`;
}

function workoutLevelImage(workout: StrengthWorkout, level: number, mode?: "hold" | "pushup"): string | undefined {
  if (workout === "core") return CORE_LEVEL_IMAGES[level];
  if (workout === "pullup") return PULLUP_LEVEL_IMAGES[level];
  if (workout === "pushup") return PUSHUP_LEVEL_IMAGES[level];
  if (workout === "handstand") {
    return mode === "pushup" ? HANDSTAND_PUSHUP_IMAGES[level] : HANDSTAND_HOLD_IMAGES[level];
  }
  if (workout === "squat") return SQUAT_LEVEL_IMAGES[level];
  if (workout === "plank") return PLANK_LEVEL_IMAGES[level];
  return undefined;
}

const WORKOUT_META: Record<StrengthWorkout, { title: string; desc: string; image?: string; ring: string; placeholder?: boolean }> = {
  core: {
    title: "Core",
    desc: "Hollow body, leg raises, planks — build the engine.",
    image: strengthCoreImg,
    ring: "ring-[hsl(var(--btn-orange))]/60",
  },
  pullup: {
    title: "Pull-up",
    desc: "Pulling power for steeper walls and bigger moves.",
    image: pullup4,
    ring: "ring-[hsl(var(--sky))]/60",
  },
  pushup: {
    title: "Push-up",
    desc: "Pressing strength for mantles, compression, and lockoffs.",
    image: pushup2,
    ring: "ring-[hsl(var(--btn-green))]/60",
  },
  squat: {
    title: "Squat",
    desc: "Leg drive for high steps, rockovers, and dynos.",
    image: squat2,
    ring: "ring-[hsl(var(--btn-green))]/60",
  },
  handstand: {
    title: "Handstand",
    desc: "Holds or pushups — balance and pressing power upside down.",
    image: hspu3,
    ring: "ring-[hsl(var(--boss))]/60",
  },
  plank: {
    title: "Plank",
    desc: "Core lockdown — timed holds from basic to 90-degree.",
    image: plank2,
    ring: "ring-[hsl(var(--btn-orange))]/60",
  },
};

type StrengthStep =
  | "workout"
  | "first-pick"
  | "reps"
  | "boss-reps"       // single-set boss attempt
  | "hold-timer"      // regular hold (timer)
  | "hold-boss-timer" // boss hold (timer, must reach 30s unbroken)
  | "rest-pick"
  | "rest-timer"
  | "celebrate"
  | "session-summary";

type SessionLogEntry = {
  workout: StrengthWorkout;
  level: number;
  sets: StrengthSet[];
  chalk: number;
  mode?: "hold" | "pushup";
  critPre?: number | null;
};

function StrengthFlow({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const s = useGame();
  const [step, setStep] = useState<StrengthStep>("workout");
  const [workout, setWorkout] = useState<StrengthWorkout>("core");
  const [level, setLevel] = useState<number>(1);
  const [reps, setReps] = useState<number>(5);
  const [sets, setSets] = useState<StrengthSet[]>([]);
  const [restMin, setRestMin] = useState<number>(2);
  const [bossLevel, setBossLevel] = useState<number>(2);
  const [bossReps, setBossReps] = useState<number>(0);
  const [bossAttempts, setBossAttempts] = useState<number>(1);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [handstandMode, setHandstandMode] = useState<"hold" | "pushup">("hold");
  const [celebrate, setCelebrate] = useState<{ chalk: number; label: string; image?: string; critPre?: number | null; subline?: string } | null>(null);
  const [sessionLogs, setSessionLogs] = useState<SessionLogEntry[]>([]);
  const sessionChalkSoFar = sessionLogs.reduce((acc, l) => acc + l.chalk, 0);

  const unlockedMax = s.strengthLevels?.[strengthKey(workout, handstandMode)] ?? 0;
  const isFirstTime = unlockedMax <= 0;

  function pickWorkout(w: StrengthWorkout) {
    setWorkout(w);
    // For handstand, default to hold and seed both modes independently.
    const initialMode: "hold" | "pushup" = "hold";
    const max = s.strengthLevels?.[strengthKey(w, initialMode)] ?? 0;
    if (max <= 0) {
      // Everyone starts at level 1; higher levels are unlocked by beating bosses.
      setStrengthLevel(w, 1, w === "handstand" ? initialMode : undefined);
    }
    setLevel(max > 0 ? max : 1);
    setSets([]);
    setHandstandMode(initialMode);
    setReps(w === "handstand" ? 5 : 5);
    setStep("reps");
  }

  function confirmFirstPick(lv: number) {
    setStrengthLevel(workout, lv, workout === "handstand" ? handstandMode : undefined);
    setLevel(lv);
    setSets([]);
    setReps(5);
    setStep("reps");
  }

  function startBoss() {
    const next = Math.min(maxStrengthLevel(workout), Math.max(1, unlockedMax + 1));
    setBossLevel(next);
    setBossReps(strengthBossTarget(workout));
    setBossAttempts(1);
    if (isHoldExercise(workout, handstandMode)) {
      setStep("hold-boss-timer");
    } else {
      setStep("boss-reps");
    }
  }

  function logRepsAnd(action: "rest" | "finish" | "new-workout") {
    const isHandstandHold = workout === "handstand" && handstandMode === "hold";
    const cleanReps = isHandstandHold
      ? Math.max(1, Math.min(4, Math.round(reps)))
      : Math.max(1, Math.min(50, Math.round(reps)));
    const setMode: "hold" | "pushup" | undefined = workout === "handstand" ? handstandMode : undefined;
    const newSets: StrengthSet[] = [...sets, { reps: cleanReps, level, ...(setMode ? { mode: setMode } : {}) }];
    setSets(newSets);
    setReps(cleanReps);
    if (action === "finish") {
      const dateISO = new Date(date).toISOString();
      const { chalk, breakdown } = logStrength({ workout, level, sets: newSets, date: dateISO });
      toast.success(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />+{chalk} Chalk · {WORKOUT_META[workout].title} L{level}</div>);
      const critPre = findCritPre(breakdown);
      const finalEntry: SessionLogEntry = { workout, level, sets: newSets, chalk, mode: setMode, critPre };
      if (sessionLogs.length > 0) {
        setSessionLogs(prev => [...prev, finalEntry]);
        setStep("session-summary");
      } else {
        setCelebrate({ chalk, label: `${WORKOUT_META[workout].title} L${level} · ${newSets.length} set${newSets.length === 1 ? "" : "s"}`, image: workoutLevelImage(workout, level, setMode) ?? WORKOUT_META[workout].image, critPre });
        setStep("celebrate");
      }
    } else if (action === "new-workout") {
      const dateISO = new Date(date).toISOString();
      const { chalk, breakdown } = logStrength({ workout, level, sets: newSets, date: dateISO });
      toast.success(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />+{chalk} Chalk · {WORKOUT_META[workout].title} L{level} · pick next workout</div>);
      setSessionLogs(prev => [...prev, { workout, level, sets: newSets, chalk, mode: setMode, critPre: findCritPre(breakdown) }]);
      setSets([]);
      setReps(5);
      setStep("workout");
    } else {
      setStep("rest-pick");
    }
  }

  function addBossRep() {
    const mode = workout === "handstand" ? handstandMode : undefined;
    const target = strengthBossTarget(workout);
    const progress = getStrengthBossProgress(workout, mode);
    const remaining = Math.max(1, target - progress);
    const reps = Math.max(1, Math.min(remaining, Math.round(bossAttempts)));
    const res = logStrengthBossRep(workout, reps, mode);
    if (res.defeated) {
      toast.success(`Boss defeated! Unlocked Level ${res.unlockedLevel}`);
      setCelebrate({
        chalk: res.chalk,
        label: `Strength Boss defeated · L${res.unlockedLevel}`,
        image: workoutLevelImage(workout, res.unlockedLevel ?? bossLevel) ?? WORKOUT_META[workout].image,
      });
      setStep("celebrate");
    } else {
      const unit = reps === 1 ? "rep" : "reps";
      toast.success(`+${reps} ${unit} · ${res.progress}/${res.target}`);
      const newRemaining = Math.max(1, res.target - res.progress);
      setBossAttempts(a => Math.min(a, newRemaining));
    }
  }

  function pickRest(min: number) {
    setRestMin(min);
    setSets(prev => prev.length ? prev.map((st, i) => i === prev.length - 1 ? { ...st, restSeconds: min * 60 } : st) : prev);
    setStep("rest-timer");
  }

  if (step === "celebrate" && celebrate) {
    return (
      <div className="text-center py-6">
        <SimpleCelebrate
          total={celebrate.chalk}
          label={celebrate.label}
          image={celebrate.image ?? strengthImg}
          alt={WORKOUT_META[workout].title}
          critPre={celebrate.critPre}
        />
        {celebrate.subline && (
          <div className="mt-3 text-sm font-display font-bold text-[hsl(var(--chalk-glow))]">
            {celebrate.subline}
          </div>
        )}
        <div className="mt-4">
          <GameButton variant="primary" onClick={onDone}>Done</GameButton>
        </div>
      </div>
    );
  }

  if (step === "session-summary") {
    const totalChalk = sessionLogs.reduce((a, l) => a + l.chalk, 0);
    const totalReps = sessionLogs.reduce(
      (a, l) => a + l.sets.filter(st => st.mode !== "hold").reduce((x, y) => x + y.reps, 0),
      0,
    );
    return (
      <>
        <DialogHeader>
          <DialogTitle>Session complete</DialogTitle>
          <DialogDescription>
            {sessionLogs.length} workouts · {totalReps} total reps
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {sessionLogs.map((l, i) => {
            const meta = WORKOUT_META[l.workout];
            const repCount = l.sets.filter(st => st.mode !== "hold").reduce((x, y) => x + y.reps, 0);
            const holdCount = l.sets.filter(st => st.mode === "hold").length;
            const img = workoutLevelImage(l.workout, l.level, l.mode) ?? meta.image;
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-2">
                <HeaderImage src={img ?? strengthImg} alt={meta.title} ring="ring-2 ring-[hsl(var(--btn-orange))]/40" />
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold truncate">{meta.title} · L{l.level}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.sets.length} set{l.sets.length === 1 ? "" : "s"}
                    {repCount > 0 ? ` · ${repCount} reps` : ""}
                    {holdCount > 0 ? ` · ${holdCount} hold${holdCount === 1 ? "" : "s"}` : ""}
                  </div>
                  {typeof l.critPre === "number" && l.critPre > 0 && (
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[hsl(var(--epic))]/20 text-[hsl(var(--epic))] border border-[hsl(var(--epic))]/40">
                      💥 Crit! {l.critPre} × 2
                    </div>
                  )}
                </div>
                <div className="text-right font-display font-bold text-[hsl(var(--btn-orange))]">+{l.chalk}</div>
              </div>
            );
          })}
          <div className="flex items-center justify-between rounded-lg border-2 border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/10 p-3">
            <span className="font-display font-bold uppercase tracking-wider text-sm">Session total</span>
            <span className="font-display font-bold text-xl text-[hsl(var(--btn-orange))]">+{totalChalk} Chalk</span>
          </div>
        </div>
        <DialogFooter>
          <GameButton variant="primary" onClick={onDone}>Done</GameButton>
        </DialogFooter>
      </>
    );
  }

  if (step === "workout") {
    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
            <DialogTitle>Pick a workout</DialogTitle>
          </div>
        </DialogHeader>
        {sessionLogs.length > 0 && (
          <div className="mt-2 flex items-center justify-between rounded-md border border-[hsl(var(--btn-orange))]/40 bg-[hsl(var(--btn-orange))]/10 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              Session so far · {sessionLogs.length} workout{sessionLogs.length === 1 ? "" : "s"}
            </span>
            <span className="font-display font-bold text-[hsl(var(--btn-orange))]">+{sessionChalkSoFar} Chalk</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
          {(["core", "pullup", "pushup", "squat", "handstand", "plank"] as StrengthWorkout[]).map(w => {
            const meta = WORKOUT_META[w];
            const currentLv = w === "handstand"
              ? Math.max(1, s.strengthLevels?.handstand_hold ?? 0, s.strengthLevels?.handstand_pushup ?? 0)
              : Math.max(1, s.strengthLevels?.[w] ?? 1);
            const lvName = workoutLevelName(w, currentLv);
            const lvImg = workoutLevelImage(w, currentLv) ?? meta.image;
            const placeholder = (
              <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Dumbbell className="h-12 w-12 opacity-60" />
                <span className="text-xs uppercase tracking-wider">Image coming soon</span>
              </div>
            );
            return (
              <PickCard
                key={w}
                image={lvImg}
                content={meta.placeholder ? placeholder : undefined}
                title={meta.title}
                desc={`Current: L${currentLv} · ${lvName}`}
                onClick={() => pickWorkout(w)}
                ring={meta.ring}
              />
            );
          })}
        </div>
      </>
    );
  }

  if (step === "reps") {
    const isHandstand = workout === "handstand";
    const isPlank = workout === "plank";
    const isHold = (isHandstand && handstandMode === "hold") || isPlank;
    const totalReps = sets.filter(st => st.mode !== "hold").reduce((a, b) => a + b.reps, 0);
    const lvImg = workoutLevelImage(workout, level, isHandstand ? handstandMode : undefined);


    const maxLv = maxStrengthLevel(workout);
    const choices = Array.from({ length: Math.max(1, unlockedMax) }, (_, i) => i + 1);
    const canBoss = unlockedMax < maxLv;
    const nextBoss = Math.min(maxLv, unlockedMax + 1);
    const lockEdit = false;
    const levelName = workoutLevelName(workout, level, isHandstand ? handstandMode : undefined);
    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button onClick={() => sets.length === 0 ? setStep("workout") : undefined} className={cn("p-1 rounded", sets.length === 0 ? "hover:bg-secondary" : "opacity-30 cursor-not-allowed")}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <HeaderImage src={lvImg ?? WORKOUT_META[workout].image ?? boulderImg} alt={WORKOUT_META[workout].title} ring="ring-2 ring-[hsl(var(--btn-orange))]/40" />
            <div className="min-w-0">
              <DialogTitle className="truncate">{WORKOUT_META[workout].title} · L{level}</DialogTitle>
              <div className="text-xs text-muted-foreground font-display tracking-wide truncate">{levelName}</div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Level</Label>
            <div className={cn("mt-2 grid gap-1.5", maxLv >= 6 ? "grid-cols-6" : "grid-cols-5")}>
              {Array.from({ length: maxLv }, (_, i) => i + 1).map(lv => {
                const img = workoutLevelImage(workout, lv, isHandstand ? handstandMode : undefined);
                const unlocked = choices.includes(lv);
                const selected = lv === level;
                const disabled = !unlocked || lockEdit;
                return (
                  <button
                    key={lv}
                    type="button"
                    disabled={disabled}
                    onClick={() => setLevel(lv)}
                    title={workoutLevelName(workout, lv, isHandstand ? handstandMode : undefined)}
                    className={cn(
                      "rounded-lg border-2 overflow-hidden text-center transition active:translate-y-[1px]",
                      "border-[hsl(var(--panel-frame))] bg-secondary/50",
                      disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[hsl(var(--btn-orange))]",
                      selected && !disabled && "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40",
                    )}
                  >
                    {img ? (
                      <div className="aspect-square w-full overflow-hidden bg-black/40">
                        <img src={img} alt={`Level ${lv}`} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square w-full grid place-items-center bg-secondary/40 text-muted-foreground">
                        <Dumbbell className="h-6 w-6" />
                      </div>
                    )}
                    <div className="p-1">
                      <div className="text-xs text-muted-foreground leading-none">L{lv}</div>
                      <div className="text-[11px] font-display font-bold leading-tight mt-0.5 line-clamp-2">{workoutLevelName(workout, lv, isHandstand ? handstandMode : undefined)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {canBoss && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <GameButton variant="danger" size="sm" onClick={startBoss}>
                  <Skull className="h-4 w-4" /> Strength Boss · L{nextBoss} ({isHold ? `${HOLD_BOSS_TARGET_SECONDS} seconds` : `${strengthBossTarget(workout)} reps`} total)
                </GameButton>
              </div>
            )}
          </div>

          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              disabled={sets.length > 0}
            />
            {sets.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">Date locked once a set is logged in this session.</p>
            )}
          </Field>

          {sets.length > 0 && (
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <div className="menu-label mb-2">This session</div>
              <ul className="divide-y divide-border/50">
                {sets.map((st, i) => {
                  const lv = st.level ?? level;
                  const setIsHold = st.mode === "hold";
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-10 shrink-0">Set {i + 1}</span>
                        <span className="font-bold tabular-nums">L{lv} · {setIsHold ? `${st.reps}s hold` : `${st.reps} reps`}</span>
                        <span className="text-xs text-muted-foreground truncate">{workoutLevelName(workout, lv, isHandstand ? (st.mode ?? handstandMode) : undefined)}</span>
                      </span>
                      {st.restSeconds ? (
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {Math.round(st.restSeconds / 60)}m rest
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 text-xs text-muted-foreground">
                {isHandstand ? (() => {
                  const holds = sets.filter(st => st.mode === "hold").length;
                  const pushups = sets.filter(st => st.mode !== "hold").reduce((a, b) => a + b.reps, 0);
                  const parts: string[] = [];
                  if (holds > 0) parts.push(`${holds} hold${holds === 1 ? "" : "s"}`);
                  if (pushups > 0) parts.push(`${pushups} pushup rep${pushups === 1 ? "" : "s"}`);
                  return <>Total: <span className="font-bold text-foreground tabular-nums">{parts.join(" · ") || "—"}</span></>;
                })() : (
                  <>Total reps: <span className="font-bold text-foreground tabular-nums">{totalReps}</span></>
                )}
              </div>
            </div>
          )}

          {isHandstand && (
            <Field label="What are you logging?">
              <div className="grid grid-cols-2 gap-2">
                {(["hold", "pushup"] as const).map(m => {
                  const selected = handstandMode === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setHandstandMode(m);
                        const modeMax = s.strengthLevels?.[strengthKey(workout, m)] ?? 0;
                        if (modeMax <= 0) setStrengthLevel(workout, 1, m);
                        setLevel(Math.max(1, modeMax));
                        setReps(m === "hold" ? 1 : 5);
                      }}
                      className={cn(
                        "rounded-lg border-2 px-3 py-2.5 text-center font-display font-bold transition active:translate-y-[1px]",
                        "border-[hsl(var(--panel-frame))] bg-secondary/50 hover:border-[hsl(var(--btn-orange))]",
                        selected && "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/40",
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {m === "hold" ? <Timer className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
                        <span>{m === "hold" ? "Handstand Hold" : "Handstand Pushup"}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 normal-case tracking-normal">
                        {m === "hold" ? "Track seconds held" : "Track reps"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {isHold ? (
            (() => {
              const pr = getHoldRecord(workout, level, "hold");
              return (
                <div className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-4 text-center space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Current record (L{level})</div>
                    <div className="font-display font-bold text-3xl tabular-nums">
                      {pr > 0 ? `${pr}s` : "—"}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <Field label="Reps this set">
              <div className="flex items-center gap-2">
                <button
                type="button"
                onClick={() => setReps(r => Math.max(1, r - 1))}
                className="h-12 w-12 rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary text-2xl font-bold active:translate-y-[1px]"
              >−</button>
              <Input
                type="number"
                min={1}
                max={50}
                value={reps}
                onChange={e => setReps(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="h-12 text-center text-2xl font-bold tabular-nums flex-1"
              />
              <button
                type="button"
                onClick={() => setReps(r => Math.min(50, r + 1))}
                className="h-12 w-12 rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary text-2xl font-bold active:translate-y-[1px]"
              >+</button>
            </div>
          </Field>
          )}
        </div>

        {isHold ? (
          <div className="flex justify-end pt-3">
            <GameButton variant="success" size="md" onClick={() => setStep("hold-timer")}>
              <Timer className="h-4 w-4" /> START HOLD
            </GameButton>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
            <GameButton variant="ghost" size="md" onClick={() => logRepsAnd("rest")}>
              <Timer className="h-4 w-4" /> LOG & REST
            </GameButton>
            <GameButton variant="primary" size="md" onClick={() => logRepsAnd("new-workout")}>
              <Plus className="h-4 w-4" /> LOG & NEW WORKOUT
            </GameButton>
            <GameButton variant="success" size="md" onClick={() => logRepsAnd("finish")}>
              <Trophy className="h-4 w-4" /> LOG & FINISH
            </GameButton>
          </div>
        )}
      </>
    );
  }

  if (step === "hold-timer") {
    const lvImg = workoutLevelImage(workout, level, "hold");
    const lvName = workoutLevelName(workout, level, "hold");
    const pr = getHoldRecord(workout, level, "hold");
    return (
      <HoldTimerView
        title={`${WORKOUT_META[workout].title} Hold · L${level}`}
        subtitle={lvName}
        image={lvImg ?? WORKOUT_META[workout].image}
        recordSeconds={pr}
        autoStart
        onBack={() => setStep("reps")}
        onSave={(seconds) => {
          const dateISO = new Date(date).toISOString();
          const res = logStrengthHold({ workout, level, seconds, mode: "hold", date: dateISO });
          toast.success(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />+{res.chalk} Chalk · {seconds}s hold</div>);
          let subline: string | undefined;
          if (res.isFirstEver) subline = "🎉 First hold logged at this level!";
          else if (res.isNewRecord) subline = `🏆 New record! +${seconds - res.prevRecord}s over your best`;
          setCelebrate({
            chalk: res.chalk,
            label: `${WORKOUT_META[workout].title} L${level} · ${seconds}s hold`,
            image: lvImg ?? WORKOUT_META[workout].image,
            critPre: findCritPre(res.breakdown),
            subline,
          });
          setStep("celebrate");
        }}
      />
    );
  }

  if (step === "hold-boss-timer") {
    const lvImg = workoutLevelImage(workout, bossLevel, "hold");
    const lvName = workoutLevelName(workout, bossLevel, "hold");
    return (
      <HoldTimerView
        title={`Strength Boss · L${bossLevel}`}
        subtitle={lvName}
        image={lvImg ?? bossImg}
        targetSeconds={HOLD_BOSS_TARGET_SECONDS}
        bossMode
        autoStart
        onBack={() => setStep("reps")}
        onSave={(seconds) => {
          if (seconds < HOLD_BOSS_TARGET_SECONDS) {
            toast.error(`Only ${seconds}s — need ${HOLD_BOSS_TARGET_SECONDS}s unbroken. Try again!`);
            return;
          }
          const dateISO = new Date(date).toISOString();
          const res = logStrengthHold({
            workout, level: bossLevel, seconds, mode: "hold", date: dateISO, bossSend: true,
          });
          toast.success(`Boss defeated! Unlocked Level ${bossLevel}`);
          setCelebrate({
            chalk: res.chalk,
            label: `Strength Boss defeated · L${bossLevel} · ${seconds}s`,
            image: lvImg ?? WORKOUT_META[workout].image,
            critPre: findCritPre(res.breakdown),
            subline: `🏆 You held for ${seconds}s — Level ${bossLevel} unlocked!`,
          });
          setStep("celebrate");
        }}
      />
    );
  }


  if (step === "boss-reps") {
    const lvImg = workoutLevelImage(workout, bossLevel);
    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("reps")} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
            <HeaderImage src={lvImg ?? bossImg} alt="Boss" ring="ring-2 ring-[hsl(var(--boss))]/60" />
            <DialogTitle className="flex items-center gap-2"><Skull className="h-5 w-5" /> Strength Boss · L{bossLevel}</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="px-1">
          {workout === "handstand" ? (
            <>Log boss holds in <span className="font-bold text-foreground">one or more attempts</span> across multiple sessions. Reach <span className="font-bold text-foreground">{bossReps} total seconds</span> to defeat the boss and unlock Level {bossLevel}.</>
          ) : (
            <>Log boss reps in <span className="font-bold text-foreground">one or more attempts</span> across multiple sessions. Reach <span className="font-bold text-foreground">{bossReps} total reps</span> to defeat the boss and unlock Level {bossLevel}.</>
          )}
        </DialogDescription>
        <div className="space-y-4 mt-2">
          {(() => {
            const progress = getStrengthBossProgress(workout, workout === "handstand" ? handstandMode : undefined);
            const remaining = Math.max(1, bossReps - progress);
            const perAttemptMax = workout === "handstand" ? Math.min(60, remaining) : remaining;
            const reps = Math.max(1, Math.min(perAttemptMax, Math.round(bossAttempts)));
            const pct = Math.min(100, (progress / bossReps) * 100);
            const unitLabel = workout === "handstand" ? "Boss seconds logged" : "Boss reps logged";
            return (
              <>
                <div className="text-center">
                  <div className="text-5xl font-display font-bold tabular-nums">
                    {progress}<span className="text-2xl text-muted-foreground"> / {bossReps}</span>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{unitLabel}</div>
                </div>
                <div className="mx-auto max-w-sm h-3 rounded-full bg-secondary overflow-hidden border border-border">
                  <div className="h-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(var(--boss)), hsl(var(--btn-orange)))" }} />
                </div>
                <Field label={workout === "handstand" ? "Seconds this attempt (max 60)" : "Reps this attempt"}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBossAttempts(r => Math.max(1, r - 1))}
                      className="h-12 w-12 rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary text-2xl font-bold active:translate-y-[1px]"
                    >−</button>
                    <Input
                      type="number"
                      min={1}
                      max={perAttemptMax}
                      value={reps}
                      onChange={e => setBossAttempts(Math.max(1, Math.min(perAttemptMax, Number(e.target.value) || 1)))}
                      className="h-12 text-center text-2xl font-bold tabular-nums flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setBossAttempts(r => Math.min(perAttemptMax, r + 1))}
                      className="h-12 w-12 rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary text-2xl font-bold active:translate-y-[1px]"
                    >+</button>
                  </div>
                </Field>
                <div className="text-center text-xs text-muted-foreground">
                  {workout === "handstand"
                    ? <>Up to {remaining} second{remaining === 1 ? "" : "s"} remaining (max 60 per attempt). Leave and come back any time — your progress is saved.</>
                    : <>Up to {remaining} rep{remaining === 1 ? "" : "s"} remaining. Leave and come back any time — your progress is saved.</>}
                </div>
              </>
            );
          })()}
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3">
          <GameButton variant="ghost" size="sm" onClick={() => setStep("reps")}>Back</GameButton>
          <GameButton variant="danger" size="md" onClick={addBossRep}>
            {(() => {
              const target = strengthBossTarget(workout);
              const remaining = Math.max(1, target - getStrengthBossProgress(workout, workout === "handstand" ? handstandMode : undefined));
              const cap = workout === "handstand" ? Math.min(60, remaining) : remaining;
              const n = Math.max(1, Math.min(cap, Math.round(bossAttempts)));
              const unit = workout === "handstand" ? (n === 1 ? "Second" : "Seconds") : (n === 1 ? "Rep" : "Reps");
              return <><Skull className="h-4 w-4" /> Log +{n} Boss {unit}</>;
            })()}
          </GameButton>
        </div>
      </>
    );
  }

  if (step === "first-pick") {
    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("workout")} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
            <DialogTitle>Pick your {WORKOUT_META[workout].title.toLowerCase()} level</DialogTitle>
          </div>
        </DialogHeader>
        <DialogDescription className="px-1">
          You only choose this once. We'll remember it for next time and you can upgrade as you get stronger.
        </DialogDescription>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 max-h-[60vh] overflow-y-auto pr-1">
          {Array.from({ length: maxStrengthLevel(workout) }, (_, i) => i + 1).map(lv => {
            const img = workoutLevelImage(workout, lv);
            const name = workoutLevelName(workout, lv);
            return (
              <button
                key={lv}
                type="button"
                onClick={() => confirmFirstPick(lv)}
                className={cn(
                  "rounded-lg border-2 overflow-hidden text-center transition active:translate-y-[1px]",
                  "border-[hsl(var(--panel-frame))] bg-secondary/50 hover:border-[hsl(var(--btn-orange))]",
                )}
              >
                {img ? (
                  <div className="aspect-square w-full overflow-hidden bg-black/40">
                    <img src={img} alt={name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square w-full grid place-items-center bg-secondary/40 text-muted-foreground">
                    <Dumbbell className="h-8 w-8" />
                  </div>
                )}
                <div className="p-2">
                  <div className="text-xs text-muted-foreground">L{lv}</div>
                  <div className="text-sm font-display font-bold leading-tight">{name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </>
    );
  }


  if (step === "rest-pick") {
    return (
      <>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep("reps")} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
            <DialogTitle>How long to rest?</DialogTitle>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {REST_OPTIONS.map(min => (
            <button
              key={min}
              type="button"
              onClick={() => pickRest(min)}
              className="rounded-xl border-2 border-[hsl(var(--panel-frame))] bg-secondary/50 p-5 text-center transition hover:border-[hsl(var(--btn-orange))] hover:ring-4 ring-[hsl(var(--btn-orange))]/30 active:translate-y-[1px]"
            >
              <Timer className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="mt-2 text-2xl font-display font-bold">{min}<span className="text-base font-normal text-muted-foreground"> min</span></div>
            </button>
          ))}
        </div>
      </>
    );
  }

  // rest-timer
  return <RestTimer minutes={restMin} onDone={() => setStep("reps")} />;
}

function RestTimer({ minutes, onDone }: { minutes: number; onDone: () => void }) {
  const total = minutes * 60;
  const [remaining, setRemaining] = useState(total);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setRemaining(Math.max(0, total - elapsed));
    }, 250);
    return () => clearInterval(id);
  }, [total]);

  const ticking = remaining > 0;
  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const pct = ((total - remaining) / total) * 100;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Timer className="h-5 w-5" /> Resting</DialogTitle>
      </DialogHeader>
      <div className="py-6 text-center space-y-4">
        <div className="text-6xl sm:text-7xl font-display font-bold tabular-nums">{mm}:{ss}</div>
        <div className="mx-auto max-w-xs h-2.5 rounded-full bg-secondary overflow-hidden border border-border">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, hsl(var(--btn-orange)), hsl(var(--chalk-glow)))" }}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {ticking ? "Breathe. Shake out. Get ready." : "Rest complete — back to work."}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-1">
        <GameButton variant="ghost" size="md" onClick={onDone}>Skip rest</GameButton>
        <GameButton variant="primary" size="md" onClick={onDone} disabled={ticking}>
          More reps
        </GameButton>
      </div>
    </>
  );
}

// ===================== HOLD TIMER =====================
type HoldPhase = "ready" | "countdown" | "running" | "stopped";

function HoldTimerView(props: {
  title: string;
  subtitle?: string;
  image?: string;
  recordSeconds?: number;
  targetSeconds?: number; // boss target
  bossMode?: boolean;
  autoStart?: boolean; // skip "ready" phase, jump straight to 5s countdown
  onBack: () => void;
  onSave: (seconds: number) => void;
}) {
  const { title, subtitle, image, recordSeconds, targetSeconds, bossMode, autoStart, onBack, onSave } = props;
  const [phase, setPhase] = useState<HoldPhase>(autoStart ? "countdown" : "ready");
  const [countdown, setCountdown] = useState(5);
  const [elapsed, setElapsed] = useState(0); // tenths of a second
  const [adjusted, setAdjusted] = useState<number>(0); // editable seconds
  const startRef = useRef<number>(0);
  const countdownStartRef = useRef<number>(0);


  // Countdown tick
  useEffect(() => {
    if (phase !== "countdown") return;
    countdownStartRef.current = Date.now();
    const id = setInterval(() => {
      const elapsedMs = Date.now() - countdownStartRef.current;
      const remaining = Math.max(0, 5 - Math.floor(elapsedMs / 1000));
      setCountdown(remaining);
      if (elapsedMs >= 5000) {
        clearInterval(id);
        startRef.current = Date.now();
        setElapsed(0);
        setPhase("running");
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // Stopwatch tick
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 100));
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  const seconds = Math.floor(elapsed / 10);
  const tenths = elapsed % 10;
  const display = phase === "stopped" ? adjusted : seconds;
  const ss = String(Math.floor(display % 60)).padStart(2, "0");
  const mm = String(Math.floor(display / 60)).padStart(2, "0");
  const realSs = String(seconds % 60).padStart(2, "0");
  const realMm = String(Math.floor(seconds / 60)).padStart(2, "0");

  function stopHold() {
    const final = Math.floor(elapsed / 10);
    setAdjusted(final);
    setPhase("stopped");
  }
  function retry() {
    setElapsed(0);
    setAdjusted(0);
    setCountdown(5);
    setPhase("ready");
  }

  const reached = targetSeconds !== undefined ? adjusted >= targetSeconds : true;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          {image && <HeaderImage src={image} alt={title} ring={bossMode ? "ring-2 ring-[hsl(var(--boss))]/60" : "ring-2 ring-[hsl(var(--btn-orange))]/40"} />}
          <div className="min-w-0">
            <DialogTitle className="truncate flex items-center gap-2">
              {bossMode && <Skull className="h-5 w-5" />} {title}
            </DialogTitle>
            {subtitle && <div className="text-xs text-muted-foreground font-display tracking-wide truncate">{subtitle}</div>}
          </div>
        </div>
      </DialogHeader>

      <div className="py-6 text-center space-y-4">
        {/* Status line */}
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {phase === "ready" && (bossMode
            ? <>Hold for {targetSeconds}s unbroken to defeat the boss</>
            : recordSeconds && recordSeconds > 0
              ? <>Current record: <span className="text-foreground font-bold">{recordSeconds}s</span></>
              : <>First hold at this level — go for it!</>
          )}
          {phase === "countdown" && <>Get ready…</>}
          {phase === "running" && (bossMode
            ? <>Target: {targetSeconds}s</>
            : recordSeconds && recordSeconds > 0
              ? <>Beat {recordSeconds}s for a new record</>
              : <>First hold at this level — go for it!</>
          )}
          {phase === "stopped" && (bossMode
            ? (reached ? <>Boss target reached!</> : <>Need {targetSeconds}s unbroken — try again</>)
            : <>Adjust if needed, then save</>
          )}
        </div>

        {/* Big display */}
        {phase === "countdown" ? (
          <div className="font-display font-bold text-8xl tabular-nums text-[hsl(var(--btn-orange))]">
            {countdown}
          </div>
        ) : phase === "stopped" ? (
          <div className="space-y-2">
            <div className="font-display font-bold text-7xl tabular-nums">
              {adjusted}<span className="text-3xl text-muted-foreground">s</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setAdjusted(v => Math.max(0, v - 1))}
                className="h-10 w-10 rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary text-xl font-bold active:translate-y-[1px]"
              >−</button>
              <Input
                type="number"
                min={0}
                value={adjusted}
                onChange={e => setAdjusted(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                className="h-10 w-24 text-center text-xl font-bold tabular-nums"
              />
              <button
                type="button"
                onClick={() => setAdjusted(v => v + 1)}
                className="h-10 w-10 rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary text-xl font-bold active:translate-y-[1px]"
              >+</button>
            </div>
            <div className="text-[11px] text-muted-foreground">Stopwatch read {seconds}s · adjust if needed</div>
          </div>
        ) : (
          <div className="font-display font-bold text-7xl sm:text-8xl tabular-nums">
            {realMm}:{realSs}<span className="text-3xl text-muted-foreground">.{tenths}</span>
          </div>
        )}

        {/* Action */}
        {phase === "ready" && (
          <GameButton variant="success" size="md" onClick={() => { setCountdown(5); setPhase("countdown"); }}>
            <Timer className="h-4 w-4" /> START HOLD
          </GameButton>
        )}
        {phase === "running" && (
          <GameButton variant="danger" size="md" onClick={stopHold}>
            <Flag className="h-4 w-4" /> STOP HOLD
          </GameButton>
        )}
        {phase === "stopped" && (
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <GameButton variant="ghost" size="md" onClick={retry}>
              Retry
            </GameButton>
            <GameButton
              variant={bossMode && !reached ? "ghost" : "success"}
              size="md"
              onClick={() => onSave(adjusted)}
              disabled={bossMode && !reached}
            >
              <Trophy className="h-4 w-4" /> {bossMode ? "Log Boss Send" : "Save Hold"}
            </GameButton>
          </div>
        )}
      </div>
    </>
  );
}

