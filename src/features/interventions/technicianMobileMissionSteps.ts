import type { Intervention } from "@/features/interventions/types";

export type TechnicianMissionStepVisual = {
  /** 0 = offre, 1 = route, 2 = sur place */
  activeIndex: number;
  /** Pause matériel */
  paused: boolean;
};

export function resolveTechnicianMissionStepVisual(
  iv: Pick<Intervention, "status">,
  awaitingAssignment: boolean
): TechnicianMissionStepVisual {
  if (awaitingAssignment || iv.status === "assigned") {
    return { activeIndex: 0, paused: false };
  }
  if (iv.status === "en_route") {
    return { activeIndex: 1, paused: false };
  }
  if (iv.status === "waiting_material") {
    return { activeIndex: 2, paused: true };
  }
  if (iv.status === "in_progress") {
    return { activeIndex: 2, paused: false };
  }
  return { activeIndex: 2, paused: false };
}
