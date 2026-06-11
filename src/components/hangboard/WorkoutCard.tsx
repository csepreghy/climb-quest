import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Play, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { holdLabel } from "@/game/hangboard/beastmaker1000";
import type { HangStep, HangboardWorkout } from "@/game/hangboard/types";
import { HangboardRunnerDialog } from "@/components/hangboard/HangboardRunnerDialog";

interface Props {
  workout: HangboardWorkout;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

function summarise(steps: HangStep[]): { hangs: number; rest: number; holds: number } {
  let hangs = 0, rest = 0;
  const holdSet = new Set<string>();
  for (const s of steps) {
    if (s.kind === "hang") { hangs += s.seconds; holdSet.add(s.holdId); }
    else rest += s.seconds;
  }
  return { hangs, rest, holds: holdSet.size };
}

export function WorkoutCard({ workout, onDelete, canEdit = false }: Props) {
  const nav = useNavigate();
  const [runOpen, setRunOpen] = useState(false);
  const [holdsOpen, setHoldsOpen] = useState(false);
  const s = summarise(workout.steps);
  const totalSec = s.hangs + s.rest;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const hangSteps = workout.steps.filter(st => st.kind === "hang") as Extract<HangStep, { kind: "hang" }>[];

  return (
    <GameCard className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold truncate">{workout.name}</div>
          {workout.isTemplate && (
            <span className="inline-block text-[10px] uppercase tracking-wider text-[hsl(var(--btn-orange))]">Template</span>
          )}
          {workout.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{workout.description}</p>
          )}
        </div>
      </div>
      <div className="text-xs text-muted-foreground space-y-0.5">
        <div>{workout.steps.length} steps · {s.holds} hold{s.holds === 1 ? "" : "s"} · {minutes}:{seconds.toString().padStart(2, "0")}</div>
        <div>Hang {s.hangs}s · Rest {s.rest}s</div>
      </div>
      {hangSteps.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setHoldsOpen(o => !o)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={holdsOpen}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${holdsOpen ? "rotate-180" : ""}`} />
            {holdsOpen ? "Hide holds" : `Show holds (${hangSteps.length})`}
          </button>
          {holdsOpen && (
            <ul className="mt-1.5 text-xs text-muted-foreground space-y-0.5 pl-4 list-disc">
              {hangSteps.map((st, i) => (
                <li key={i}>{holdLabel(st.holdId)} · {st.seconds}s</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mt-4">
        <GameButton variant="primary" size="sm" onClick={() => setRunOpen(true)}>
          <Play className="h-4 w-4" /> Start
        </GameButton>
        {canEdit && (
          <>
            <GameButton variant="ghost" size="sm" onClick={() => nav(`/hangboard/edit/${workout.id}`)} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </GameButton>
            {onDelete && (
              <GameButton variant="danger" size="sm" onClick={() => onDelete(workout.id)} aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </GameButton>
            )}
          </>
        )}
      </div>
      <HangboardRunnerDialog workoutId={runOpen ? workout.id : null} open={runOpen} onOpenChange={setRunOpen} />
    </GameCard>
  );
}
