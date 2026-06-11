import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { GameButton } from "@/components/ui/game-button";
import { GameCard } from "@/components/ui/game-card";
import { Pause, Play, SkipForward, Volume2, VolumeX } from "lucide-react";
import { HangboardOverlay } from "@/components/hangboard/HangboardOverlay";
import { holdLabel } from "@/game/hangboard/beastmaker1000";
import { fetchWorkout } from "@/game/hangboard/api";
import type { HangboardWorkout } from "@/game/hangboard/types";
import { commitHangboardSession } from "@/game/hangboard/rewards";
import { primeAudio, tickBeep, transitionBeep, finishBeep, isMuted, setMuted } from "@/game/hangboard/audio";
import { toast } from "sonner";
import chalkBagImg from "@/assets/chalk-bag.png";

type Phase = "ready" | "countdown" | "running" | "paused" | "finished";

const READY_SECONDS = 3;

interface Props {
  workoutId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HangboardRunnerDialog({ workoutId, open, onOpenChange }: Props) {
  const [workout, setWorkout] = useState<HangboardWorkout | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [stepIdx, setStepIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [muted, setMutedState] = useState(isMuted());
  const tickedRef = useRef<Set<number>>(new Set());
  const completedHangSecRef = useRef(0);
  const perHoldSecRef = useRef<Record<string, number>>({});
  const transitioningRef = useRef(false);

  // Load / reset whenever the dialog opens for a workout.
  useEffect(() => {
    if (!open || !workoutId) {
      setWorkout(null);
      setPhase("ready");
      setStepIdx(0);
      setRemaining(0);
      tickedRef.current.clear();
      completedHangSecRef.current = 0;
      perHoldSecRef.current = {};
      transitioningRef.current = false;
      return;
    }
    fetchWorkout(workoutId).then(w => {
      setWorkout(w);
      if (w && w.steps.length > 0) setRemaining(w.steps[0].seconds);
    });
  }, [open, workoutId]);

  const current = workout?.steps[stepIdx];
  const next = workout?.steps[stepIdx + 1];

  // Timer loop.
  useEffect(() => {
    if (phase !== "running" || !current) return;
    const iv = setInterval(() => {
      setRemaining(prev => {
        if (transitioningRef.current || prev <= 0) return prev;
        const nv = prev - 1;
        if (current.kind === "hang") {
          completedHangSecRef.current += 1;
          perHoldSecRef.current[current.holdId] = (perHoldSecRef.current[current.holdId] ?? 0) + 1;
        }
        if (nv === 2 || nv === 1) {
          if (!tickedRef.current.has(nv)) { tickedRef.current.add(nv); tickBeep(); }
        }
        if (nv <= 0) {
          transitioningRef.current = true;
          setTimeout(() => {
            transitionBeep();
            tickedRef.current.clear();
            transitioningRef.current = false;
            setStepIdx(i => {
              const ni = i + 1;
              if (!workout || ni >= workout.steps.length) { setPhase("finished"); return i; }
              return ni;
            });
          }, 1050);
          return 0;
        }
        return nv;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, current, workout]);

  useEffect(() => {
    if (!workout) return;
    const s = workout.steps[stepIdx];
    if (s) setRemaining(s.seconds);
  }, [stepIdx, workout]);

  // "Get ready" countdown before the workout actually starts.
  useEffect(() => {
    if (phase !== "countdown") return;
    const iv = setInterval(() => {
      setRemaining(prev => {
        if (transitioningRef.current || prev <= 0) return prev;
        const nv = prev - 1;
        if (nv === 2 || nv === 1) {
          if (!tickedRef.current.has(nv)) { tickedRef.current.add(nv); tickBeep(); }
        }
        if (nv <= 0) {
          transitioningRef.current = true;
          setTimeout(() => {
            transitionBeep();
            tickedRef.current.clear();
            transitioningRef.current = false;
            setPhase("running");
            setRemaining(workout ? workout.steps[0].seconds : 0);
          }, 1050);
          return 0;
        }
        return nv;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, workout]);


  // Commit on finish.
  useEffect(() => {
    if (phase !== "finished" || !workout) return;
    finishBeep();
    const total = completedHangSecRef.current;
    if (total > 0) {
      const holds = Object.entries(perHoldSecRef.current).map(([holdId, seconds]) => ({ holdId, seconds }));
      const { chalk } = commitHangboardSession({
        workoutId: workout.id,
        workoutName: workout.name,
        totalHangSeconds: total,
        holds,
      });
      toast.success(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />Workout done! +{chalk} Chalk · {total}s of hang</div>);
    } else {
      toast.info("Workout ended");
    }
  }, [phase, workout]);

  function start() {
    primeAudio();
    if (!workout || workout.steps.length === 0) return;
    setStepIdx(0);
    tickedRef.current.clear();
    completedHangSecRef.current = 0;
    perHoldSecRef.current = {};
    transitioningRef.current = false;
    setRemaining(READY_SECONDS);
    setPhase("countdown");
  }

  function pause() { setPhase("paused"); }
  function resume() { setPhase("running"); }
  function skip() {
    transitioningRef.current = false;
    setStepIdx(i => {
      const ni = i + 1;
      if (!workout || ni >= workout.steps.length) { setPhase("finished"); return i; }
      return ni;
    });
    tickedRef.current.clear();
  }
  function stop() { setPhase("finished"); }
  function toggleMute() { const nm = !muted; setMuted(nm); setMutedState(nm); }

  const phaseColor = current?.kind === "hang"
    ? "text-[hsl(var(--btn-orange))]"
    : current?.kind === "rest"
      ? "text-[hsl(var(--sky))]"
      : "text-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[98vw] max-h-[95vh] overflow-y-auto p-3 sm:p-5">
        <VisuallyHidden><DialogTitle>{workout?.name ?? "Hangboard workout"}</DialogTitle></VisuallyHidden>

        {!workout ? (
          <p className="text-sm text-muted-foreground p-8 text-center">Loading workout…</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hangboard</div>
                <h2 className="text-lg sm:text-2xl font-bold tracking-tight truncate">{workout.name}</h2>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <GameButton variant="ghost" size="sm" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </GameButton>
              </div>
            </div>

            {(() => {
              const total = phase === "countdown"
                ? READY_SECONDS
                : current?.seconds ?? 1;
              const pct = Math.max(0, Math.min(1, remaining / Math.max(1, total)));
              const size = 130;
              const stroke = 10;
              const r = (size - stroke) / 2;
              const c = 2 * Math.PI * r;
              const ringColor = phase === "countdown"
                ? "hsl(var(--foreground))"
                : current?.kind === "hang"
                  ? "hsl(var(--btn-orange))"
                  : "hsl(var(--sky))";
              let nextHang: { holdId: string } | null = null;
              if (workout) {
                for (let i = stepIdx + 1; i < workout.steps.length; i++) {
                  const s = workout.steps[i];
                  if (s.kind === "hang") { nextHang = { holdId: s.holdId }; break; }
                }
              }
              const currentHangLabel =
                phase === "countdown" && workout.steps[0].kind === "hang"
                  ? holdLabel((workout.steps[0] as Extract<typeof workout.steps[0], { kind: "hang" }>).holdId)
                  : current?.kind === "hang"
                    ? holdLabel(current.holdId)
                    : null;
              const phaseLabel = phase === "ready" ? "Ready"
                : phase === "countdown" ? "Get ready"
                : phase === "finished" ? "Finished"
                : current?.kind === "hang" ? "HANG" : "REST";
              return (
                <div className="flex items-center gap-3 sm:gap-5">
                  {/* Left: shrinking ring inside its own compact card */}
                  <GameCard tone="accent" className="p-2 sm:p-3 shrink-0">
                    <div className="relative" style={{ width: size, height: size }}>
                      <svg width={size} height={size} className="-rotate-90">
                        <circle cx={size/2} cy={size/2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" opacity={0.3} />
                        <circle
                          key={`${phase}-${stepIdx}`}
                          cx={size/2} cy={size/2} r={r}
                          stroke={ringColor} strokeWidth={stroke} fill="none"
                          strokeLinecap={pct < 0.05 ? "butt" : "round"}
                          strokeDasharray={c}
                          strokeDashoffset={c * (1 - pct)}
                          style={{ transition: "stroke-dashoffset 1s linear" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-4xl font-extrabold tabular-nums">
                          {phase === "finished" ? "✓" : remaining}
                        </div>
                      </div>
                    </div>
                  </GameCard>

                  {/* Right: phase, current hang, next, buttons */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className={`text-[10px] uppercase tracking-wider ${phase === "countdown" ? "text-foreground" : phaseColor}`}>
                      {phaseLabel}
                      {phase !== "countdown" && phase !== "finished" && (
                        <span className="ml-2 text-muted-foreground normal-case tracking-normal">
                          {Math.min(stepIdx + 1, workout.steps.length)}/{workout.steps.length}
                        </span>
                      )}
                    </div>

                    {currentHangLabel ? (
                      <div className="text-2xl sm:text-3xl font-extrabold leading-tight text-fuchsia-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                        {currentHangLabel}
                      </div>
                    ) : current?.kind === "rest" ? (
                      <div className="text-xl sm:text-2xl font-bold text-[hsl(var(--sky))]">Catch your breath</div>
                    ) : null}

                    {nextHang && phase !== "finished" && (
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        Next: <span className="font-semibold text-foreground">{holdLabel(nextHang.holdId)}</span>
                      </div>
                    )}

                    <div className="flex flex-nowrap gap-2 mt-1">
                      {phase === "ready" && (
                        <GameButton variant="primary" size="md" onClick={start}><Play className="h-4 w-4" /> Start</GameButton>
                      )}
                      {(phase === "running" || phase === "countdown") && (
                        <>
                          <GameButton variant="primary" size="sm" onClick={pause}><Pause className="h-4 w-4" /> Pause</GameButton>
                          <GameButton variant="primary" size="sm" onClick={skip}><SkipForward className="h-4 w-4" /> Skip</GameButton>
                        </>
                      )}
                      {phase === "paused" && (
                        <>
                          <GameButton variant="primary" size="sm" onClick={resume}><Play className="h-4 w-4" /> Resume</GameButton>
                          <GameButton variant="danger" size="sm" onClick={stop}>Stop</GameButton>
                        </>
                      )}
                      {phase === "finished" && (
                        <GameButton variant="primary" size="md" onClick={() => onOpenChange(false)}>Done</GameButton>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            <HangboardOverlay
              crop
              activeHoldId={current?.kind === "hang" ? current.holdId : (phase === "countdown" && workout.steps[0].kind === "hang" ? (workout.steps[0] as Extract<typeof workout.steps[0], {kind:"hang"}>).holdId : null)}
            />

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
