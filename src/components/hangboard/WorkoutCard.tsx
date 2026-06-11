import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Play, Pencil, Trash2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHoldLabel } from "@/game/hangboard/calibration";
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
  const holdLabel = useHoldLabel();
  const [runOpen, setRunOpen] = useState(false);
  const [holdsOpen, setHoldsOpen] = useState(false);
  const s = summarise(workout.steps);
  const totalSec = s.hangs + s.rest;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const hangSteps = workout.steps.filter(st => st.kind === "hang") as Extract<HangStep, { kind: "hang" }>[];

  return (
    <GameCard className="p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold truncate text-base">{workout.name}</div>
          {workout.isTemplate && (
            <span className="inline-block text-[10px] uppercase tracking-wider text-[hsl(var(--btn-orange))]">Template</span>
          )}
          {workout.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{workout.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold tabular-nums text-foreground">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{workout.steps.length} steps</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{s.holds} hold{s.holds === 1 ? "" : "s"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--btn-orange))]/15 text-[hsl(var(--btn-orange))] font-semibold tabular-nums">
            Hang {s.hangs}s
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--sky))]/15 text-[hsl(var(--sky))] font-semibold tabular-nums">
            Rest {s.rest}s
          </span>
        </div>
      </div>

      {hangSteps.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => setHoldsOpen(o => !o)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-expanded={holdsOpen}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${holdsOpen ? "rotate-180" : ""}`} />
            {holdsOpen ? "Hide holds" : `Show holds (${hangSteps.length})`}
          </button>
          {holdsOpen && (
            <ul className="mt-2 text-xs space-y-1 pl-4 list-disc marker:text-muted-foreground/60">
              {hangSteps.map((st, i) => (
                <li key={i}>
                  <span className="text-foreground">{holdLabel(st.holdId)}</span>
                  <span className="text-muted-foreground"> · {st.seconds}s</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-2">
        <GameButton variant="success" size="sm" className="w-9 px-0" onClick={() => setRunOpen(true)} aria-label="Start">
          <Play className="h-4 w-4" />
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
