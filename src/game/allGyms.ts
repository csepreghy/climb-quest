// Combines a user's local gyms (from gyms.ts) with admin-managed public gyms.
import { useGyms, GymState } from "./gyms";
import { usePublicGyms } from "./publicGyms";

export function useAllGyms(): GymState {
  const local = useGyms();
  const pub = usePublicGyms();
  // Merge gyms (local first), de-dup grading systems by id (local wins).
  const gymIds = new Set(local.gyms.map(g => g.id));
  const gyms = [...local.gyms, ...pub.gyms.filter(g => !gymIds.has(g.id))];
  const gsIds = new Set(local.gradingSystems.map(g => g.id));
  const gradingSystems = [
    ...local.gradingSystems,
    ...pub.gradingSystems.filter(g => !gsIds.has(g.id)),
  ];
  return { gyms, gradingSystems, lastUsedGymId: local.lastUsedGymId };
}
