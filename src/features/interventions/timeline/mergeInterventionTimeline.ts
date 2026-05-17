import type { InterventionEvent } from "@/features/interventions/types";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";
import type { InterventionTimelineDoc } from "@/features/interventions/timeline/interventionTimelineTypes";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";

function toIsoString(value: unknown): string {
  const d = coerceFirestoreLikeDate(value);
  return d ? d.toISOString() : new Date(0).toISOString();
}

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

export function emailToInterventionEvent(email: InterventionEmailDoc): InterventionEvent {
  const outbound = email.direction === "outbound";
  return {
    id: `email-${email.id}`,
    interventionId: email.interventionId,
    type: "email",
    createdAt: toIsoString(email.createdAt),
    createdByUid: email.sentByUid ?? "system",
    content: `${outbound ? "→" : "←"} ${email.subject}\n${email.bodyText}`,
    visibility: "internal",
  };
}

export function materialOrderToInterventionEvent(order: MaterialOrderDoc): InterventionEvent {
  const parts = order.partsRequested
    .map((p) => `${p.quantity}× ${p.description}`)
    .join(", ");
  return {
    id: `material-${order.id}`,
    interventionId: order.interventionId,
    type: "material_order",
    createdAt: order.createdAt,
    createdByUid: order.technicianUid,
    content: `${parts} (${order.status})`,
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
  options?: {
    clientVisibleOnly?: boolean;
    emails?: InterventionEmailDoc[];
    materialOrders?: MaterialOrderDoc[];
  },
): InterventionEvent[] {
  const clientOnly = options?.clientVisibleOnly === true;
  const rows: InterventionEvent[] = [
    ...statusEvents.map(statusEventToInterventionEvent),
    ...timelineDocs.map(({ id, data }) => timelineDocToInterventionEvent(id, data)),
    ...(options?.emails ?? []).map(emailToInterventionEvent),
    ...(options?.materialOrders ?? []).map(materialOrderToInterventionEvent),
  ];

  const filtered = clientOnly
    ? rows.filter(
        (r) =>
          r.type === "status_change" ||
          (r.visibility === "client" && r.type !== "email" && r.type !== "material_order"),
      )
    : rows;

  return filtered.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}
