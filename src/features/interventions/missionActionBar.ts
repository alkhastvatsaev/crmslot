import type { Intervention } from "@/features/interventions/types";
import { isInterventionPendingBackOfficeIntake } from "@/features/interventions/technicianSchedule";

export type MissionActionVariant = "blue" | "amber" | "emerald" | "purple";

export type MissionPrimaryAction =
  | {
      kind: "transition";
      toStatus: Intervention["status"];
      labelKey: string;
      variant: MissionActionVariant;
      testId: string;
    }
  | {
      kind: "finish";
      labelKey: string;
      testId: string;
    };

export type MissionActionBarConfig = {
  primary: MissionPrimaryAction | null;
  showQuickRow: boolean;
  canMaterials: boolean;
  canFinish: boolean;
};

export function resolveMissionActionBar(
  iv: Pick<Intervention, "status" | "clientPhone" | "phone" | "address" | "clientEmail">,
  opts?: { awaitingAssignment?: boolean },
): MissionActionBarConfig {
  const status = iv.status;
  const awaitingAssignment = opts?.awaitingAssignment ?? status === "assigned";
  const terminal =
    status === "done" || status === "invoiced" || status === "cancelled";

  if (terminal || awaitingAssignment) {
    return {
      primary: null,
      showQuickRow: false,
      canMaterials: false,
      canFinish: false,
    };
  }

  const canMaterials = status === "in_progress" || status === "waiting_material";
  const canFinish = status === "in_progress";

  let primary: MissionPrimaryAction | null = null;

  if (status === "en_route") {
    primary = {
      kind: "transition",
      toStatus: "in_progress",
      labelKey: "technician_hub.dashboard.detail.on_site",
      variant: "amber",
      testId: "mission-action-primary-on-site",
    };
  } else if (isInterventionPendingBackOfficeIntake(iv)) {
    primary = {
      kind: "transition",
      toStatus: "en_route",
      labelKey: "technician_hub.mission_action.depart",
      variant: "blue",
      testId: "mission-action-primary-depart",
    };
  } else if (status === "in_progress") {
    primary = {
      kind: "finish",
      labelKey: "technician_hub.dashboard.detail.finish_job",
      testId: "mission-action-primary-finish",
    };
  } else if (status === "waiting_material") {
    primary = {
      kind: "transition",
      toStatus: "in_progress",
      labelKey: "technician_hub.dashboard.detail.resume_work",
      variant: "blue",
      testId: "mission-action-primary-resume",
    };
  }

  return {
    primary,
    /** Contacts dans la fiche mission ; pas de rangée d’actions en bas. */
    showQuickRow: false,
    canMaterials,
    canFinish,
  };
}
