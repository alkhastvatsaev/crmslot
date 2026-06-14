import { formatPortalAppointmentLabel } from "@/features/interventions/technicianSchedule";

export type TrackingPhaseId =
  | "draft"
  | "received"
  | "technician"
  | "active"
  | "completed"
  | "cancelled";

export type TrackingPhase = {
  id: TrackingPhaseId;
  /** 0–3 for the 4-segment bar; -1 hides the bar (draft / cancelled). */
  progressIndex: number;
  showCompletionExtras: boolean;
  showEta: boolean;
};

export const TRACKING_PROGRESS_SEGMENT_COUNT = 4;

export function resolveTrackingPhase(input: {
  hasIntervention: boolean;
  hasDraft: boolean;
  isSubmitting: boolean;
  status: string;
}): TrackingPhase {
  const { hasIntervention, status } = input;

  if (!hasIntervention) {
    return {
      id: "draft",
      progressIndex: -1,
      showCompletionExtras: false,
      showEta: false,
    };
  }

  switch (status) {
    case "cancelled":
      return {
        id: "cancelled",
        progressIndex: -1,
        showCompletionExtras: false,
        showEta: false,
      };
    case "pending":
    case "pending_needs_address":
      return {
        id: "received",
        progressIndex: 0,
        showCompletionExtras: false,
        showEta: true,
      };
    case "assigned":
    case "en_route":
      return {
        id: "technician",
        progressIndex: 1,
        showCompletionExtras: false,
        showEta: false,
      };
    case "on_site":
    case "in_progress":
    case "waiting_material":
      return {
        id: "active",
        progressIndex: 2,
        showCompletionExtras: false,
        showEta: false,
      };
    case "done":
    case "invoiced":
      return {
        id: "completed",
        progressIndex: 3,
        showCompletionExtras: true,
        showEta: false,
      };
    default:
      return {
        id: "received",
        progressIndex: 0,
        showCompletionExtras: false,
        showEta: true,
      };
  }
}

export function getTrackingHeadlineKey(status: string, hasIntervention: boolean): string {
  if (!hasIntervention) return "tracking.headline.draft";
  const key = `tracking.headline.${status}`;
  return key;
}

export function getTrackingEtaLabel(
  intervention: {
    status?: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    requestedDate?: string | null;
    requestedTime?: string | null;
  },
  locale: string,
  t: (key: string) => string | unknown
): string | null {
  const date = intervention.scheduledDate?.trim() || intervention.requestedDate?.trim() || "";
  const time = intervention.scheduledTime?.trim() || intervention.requestedTime?.trim() || "";
  if (date) {
    return formatPortalAppointmentLabel(date, time || null, locale);
  }
  if (intervention.status === "pending" || intervention.status === "pending_needs_address") {
    return String(t("portal_enrichment.eta_asap"));
  }
  return null;
}
