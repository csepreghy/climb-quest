import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { GameButton } from "@/components/ui/game-button";
import { GameCard } from "@/components/ui/game-card";
import { Pause, Play, SkipForward, Volume2, VolumeX, X } from "lucide-react";
import { HangboardOverlay } from "@/components/hangboard/HangboardOverlay";
import { holdLabel } from "@/game/hangboard/beastmaker1000";
import { fetchWorkout } from "@/game/hangboard/api";
import type { HangboardWorkout } from "@/game/hangboard/types";
import { commitHangboardSession, CHALK_PER_HANG_SECOND } from "@/game/hangboard/rewards";
import { primeAudio, tickBeep, transitionBeep, finishBeep, isMuted, setMuted } from "@/game/hangboard/audio";
import { toast } from "sonner";
import chalkBagImg from "@/assets/chalk-bag.png";

type Phase = "ready" | "running" | "paused" | "finished";

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
        const nv = prev - 1;
        if (current.kind === "hang") {
          completedHangSecRef.current += 1;
          perHoldSecRef.current[current.holdId] = (perHoldSecRef.current[current.holdId] ?? 0) + 1;
        }
        if (nv === 2 || nv === 1) {
          if (!tickedRef.current.has(nv)) { tickedRef.current.add(nv); tickBeep(); }
        }
        if (nv <= 0) {
          tickedRef.current.clear();
          transitionBeep();
          setStepIdx(i => {
            const ni = i + 1;
            if (!workout || ni >= workout.steps.length) { setPhase("finished"); return i; }
            return ni;
          });
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
    setPhase("running");
    setStepIdx(0);
    setRemaining(workout.steps[0].seconds);
    tickedRef.current.clear();
    completedHangSecRef.current = 0;
    perHoldSecRef.current = {};
  }
  function pause() { setPhase("paused"); }
  function resume() { setPhase("running"); }
  function skip() {
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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-y-auto p-5">
        <VisuallyHidden><DialogTitle>{workout?.name ?? "Hangboard workout"}</DialogTitle></VisuallyHidden>

        {!workout ? (
          <p className="text-sm text-muted-foreground p-8 text-center">Loading workout…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Hangboard</div>
                <h2 className="text-2xl font-bold tracking-tight">{workout.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <GameButton variant="ghost" size="sm" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </GameButton>
                <GameButton variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Close">
                  <X className="h-4 w-4" />
                </GameButton>
              </div>
            </div>

            <GameCard tone="accent" className="p-5 text-center">
              <div className={`text-xs uppercase tracking-wider ${phaseColor}`}>
                {phase === "ready" ? "Ready" : phase === "finished" ? "Finished" : current?.kind === "hang" ? "HANG" : "REST"}
              </div>
              <div className="text-7xl font-extrabold tabular-nums my-2">
                {phase === "finished" ? "✓" : remaining}
              </div>
              {phase !== "finished" && current?.kind === "hang" && (
                <div className="text-lg font-semibold">{holdLabel(current.holdId)}</div>
              )}
              {phase !== "finished" && current?.kind === "rest" && (
                <div className="text-sm text-muted-foreground">Catch your breath</div>
              )}
              {next && phase !== "finished" && (
                <div className="text-xs text-muted-foreground mt-2">
                  Next: {next.kind === "hang" ? `Hang · ${holdLabel(next.holdId)}` : "Rest"} · {next.seconds}s
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Step {Math.min(stepIdx + 1, workout.steps.length)} / {workout.steps.length}
              </div>

              <div className="flex justify-center gap-2 mt-4">
                {phase === "ready" && (
                  <GameButton variant="primary" size="md" onClick={start}><Play className="h-4 w-4" /> Start</GameButton>
                )}
                {phase === "running" && (
                  <>
                    <GameButton variant="ghost" size="sm" onClick={pause}><Pause className="h-4 w-4" /> Pause</GameButton>
                    <GameButton variant="ghost" size="sm" onClick={skip}><SkipForward className="h-4 w-4" /> Skip</GameButton>
                  </>
                )}
                {phase === "paused" && (
                  <>
                    <GameButton variant="primary" size="sm" onClick={resume}><Play className="h-4 w-4" /> Resume</GameButton>
                    <GameButton variant="danger" size="sm" onClick={stop}>Stop</GameButton>
                  </>
                )}
                {phase === "finished" && (
                  <GameButton variant="primary" size="sm" onClick={() => onOpenChange(false)}>Done</GameButton>
                )}
              </div>
            </GameCard>

            <HangboardOverlay activeHoldId={current?.kind === "hang" ? current.holdId : null} />

            <p className="text-xs text-muted-foreground text-center">
              {CHALK_PER_HANG_SECOND} Chalk per second of completed hang. Keep this dialog open for audio cues.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
