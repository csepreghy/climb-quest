import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Play, Pencil, Trash2 } from "lucide-react";
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
  const s = summarise(workout.steps);
  const totalSec = s.hangs + s.rest;
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  const preview = workout.steps
    .filter(st => st.kind === "hang")
    .slice(0, 3)
    .map(st => st.kind === "hang" ? holdLabel(st.holdId) : "")
    .join(" • ");

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
        {preview && <div className="truncate">{preview}{workout.steps.filter(x => x.kind === "hang").length > 3 ? "…" : ""}</div>}
      </div>
      <div className="flex items-center gap-2 mt-auto">
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
    </GameCard>
  );
}
