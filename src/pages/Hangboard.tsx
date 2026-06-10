import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GameButton } from "@/components/ui/game-button";
import { GameCard } from "@/components/ui/game-card";
import { Plus, Dumbbell } from "lucide-react";
import { useHangboardWorkouts, deleteWorkout } from "@/game/hangboard/api";
import { WorkoutCard } from "@/components/hangboard/WorkoutCard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Hangboard() {
  const { user, isAdmin } = useAuth();
  const { workouts, loading, refresh } = useHangboardWorkouts();
  const nav = useNavigate();

  const mine = useMemo(() => workouts.filter(w => w.userId === user?.id), [workouts, user?.id]);
  const templates = useMemo(() => workouts.filter(w => w.isTemplate), [workouts]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this workout?")) return;
    const ok = await deleteWorkout(id);
    if (ok) { toast.success("Workout deleted"); refresh(); }
    else toast.error("Could not delete");
  };

  return (
    <div className="space-y-6 animate-float-up">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Hangboard</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a workout or build your own on the Beastmaker 1000. Hang seconds count toward your rolling 7-day Strength Tier.
          </p>
        </div>
        <GameButton variant="primary" size="sm" onClick={() => nav("/hangboard/new")}>
          <Plus className="h-4 w-4" /> New Workout
        </GameButton>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3">Featured templates</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : templates.length === 0 ? (
          <GameCard className="p-4 text-sm text-muted-foreground">
            No templates yet. {isAdmin && (<>You're an admin — <Link className="underline" to="/hangboard/new">create one</Link> and tick "Save as template" so everyone can use it.</>)}
          </GameCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map(w => (
              <WorkoutCard key={w.id} workout={w} canEdit={isAdmin} onDelete={onDelete} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">My workouts</h2>
        {mine.length === 0 ? (
          <GameCard className="p-4 text-sm text-muted-foreground">
            You haven't built any workouts yet. <Link to="/hangboard/new" className="underline">Create one</Link>.
          </GameCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {mine.map(w => (
              <WorkoutCard key={w.id} workout={w} canEdit onDelete={onDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
