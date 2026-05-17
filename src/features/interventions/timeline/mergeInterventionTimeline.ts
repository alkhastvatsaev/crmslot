import type { InterventionEvent } from "@/features/interventions/types";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";
import type { InterventionTimelineDoc } from "@/features/interventions/timeline/interventionTimelineTypes";

export function statusEventToInterventionEvent(ev: InterventionStatusEvent): InterventionEvent {
  return {
    id: `status-${ev.id}`,
    interventionId: ev.interventionId,
    type: "status_change",
    createdAt: ev.at,
    createdByUid: ev.actorUid,
    oldStatus: ev.fromStatus ?? undefined,
    newStatus: ev.toStatus,
    content: ev.note ?? undefined,
    actorRole: ev.actorRole,
    visibility: "internal",
  };
}

export function timelineDocToInterventionEvent(
  id: string,
  doc: InterventionTimelineDoc,
): InterventionEvent {
  return {
    id: `timeline-${id}`,
    interventionId: doc.interventionId,
    type: doc.type,
    createdAt: doc.createdAt,
    createdByUid: doc.createdByUid,
    content: doc.content,
    visibility: doc.visibility,
  };
}

/** Fusionne statuts + notes, tri chronologique (plus ancien en premier). */
export function mergeInterventionTimelineEvents(
  statusEvents: InterventionStatusEvent[],
  timelineDocs: Array<{ id: string; data: InterventionTimelineDoc }>,
  options?: { clientVisibleOnly?: boolean },
): InterventionEvent[] {
  const clientOnly = options?.clientVisibleOnly === true;
  const rows: InterventionEvent[] = [
    ...statusEvents.map(statusEventToInterventionEvent),
    ...timelineDocs.map(({ id, data }) => timelineDocToInterventionEvent(id, data)),
  ];

  const filtered = clientOnly
    ? rows.filter((r) => r.type === "status_change" || r.visibility === "client")
    : rows;

  return filtered.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
