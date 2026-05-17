import type { InterventionEvent } from "@/features/interventions/types";

/** Document Firestore `interventions/{id}/timeline_events/{eventId}`. */
export type InterventionTimelineDoc = {
  interventionId: string;
  type: Exclude<InterventionEvent["type"], "status_change">;
  content: string;
  visibility: "internal" | "client";
  createdAt: string;
  createdByUid: string;
  companyId?: string | null;
};

export type AddTimelineCommentParams = {
  interventionId: string;
  content: string;
  companyId?: string | null;
  visibility?: "internal" | "client";
};
