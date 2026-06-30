// Returns the user's effective gym list: their own local gyms plus any
// admin-managed public gyms they have explicitly added to their list.
import { useGyms, GymState, Gym } from "./gyms";
import { usePublicGyms } from "./publicGyms";

export type GymWithSource = Gym & { isPublic?: boolean };

export interface AllGymsState extends Omit<GymState, "gyms"> {
  gyms: GymWithSource[];
}

function buildState(includeAllPublic: boolean): AllGymsState {
  // NOTE: cannot reference hooks inside here — caller is responsible.
  throw new Error("internal");
}

function combine(local: GymState, pub: ReturnType<typeof usePublicGyms>, includeAllPublic: boolean): AllGymsState {
  const localIds = new Set(local.gyms.map(g => g.id));
  const addedPublic = pub.gyms
    .filter(g => (includeAllPublic || local.addedPublicGymIds.includes(g.id)) && !localIds.has(g.id))
    .map<GymWithSource>(g => ({ ...g, isPublic: true }));
  const gyms: GymWithSource[] = [...local.gyms, ...addedPublic];

  // Include grading systems referenced by any of these gyms.
  const referenced = new Set<string>();
  gyms.forEach(g => g.gradingSystemIds.forEach(id => referenced.add(id)));
  const gsIds = new Set(local.gradingSystems.map(g => g.id));
  const gradingSystems = [
    ...local.gradingSystems,
    ...pub.gradingSystems.filter(g => !gsIds.has(g.id) && referenced.has(g.id)),
  ];
  return {
    gyms,
    gradingSystems,
    lastUsedGymId: local.lastUsedGymId,
    addedPublicGymIds: local.addedPublicGymIds,
  };
}

export function useAllGyms(): AllGymsState {
  return combine(useGyms(), usePublicGyms(), false);
}

/** Like useAllGyms, but also surfaces every public gym so users can log climbs
 *  at gyms they haven't added to their personal list. Use only in logging UIs. */
export function useAllGymsForLogging(): AllGymsState {
  return combine(useGyms(), usePublicGyms(), true);
}
