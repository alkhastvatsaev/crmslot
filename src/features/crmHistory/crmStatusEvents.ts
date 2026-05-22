import type { Intervention } from "@/features/interventions/types";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";
import type { CrmActivityEvent, CrmEventType } from "./crmActivityTypes";
import { parseTs } from "./crmActivityLog";

function interventionBase(
  iv: Intervention | undefined,
  interventionId: string,
): Pick<CrmActivityEvent, "interventionId" | "interventionTitle" | "clientName" | "address"> {
  const clientName =
    iv?.clientCompanyName ??
    iv?.clientName ??
    (iv?.clientFirstName || iv?.clientLastName
      ? [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ")
      : undefined);
  return {
    interventionId,
    interventionTitle: iv?.title,
    clientName,
    address: iv?.address,
  };
}

function resolveStatusEventType(evt: InterventionStatusEvent): CrmEventType {
  if (
    evt.actorRole === "technician" &&
    evt.fromStatus === "assigned" &&
    evt.toStatus === "pending"
  ) {
    return "intervention_technician_declined";
  }
  if (evt.toStatus === "done") return "intervention_completed";
  if (evt.toStatus === "invoiced" && evt.fromStatus === "done") {
    return "intervention_report_validated";
  }
  if (evt.toStatus === "invoiced") return "intervention_invoiced";
  if (evt.toStatus === "cancelled") return "intervention_cancelled";
  if (evt.fromStatus === "pending" && evt.toStatus === "assigned") {
    return "intervention_assigned";
  }
  return "intervention_status";
}

export function statusEventToCrmEvent(
  evt: InterventionStatusEvent,
  interventionMap: Map<string, Intervention>,
): CrmActivityEvent | null {
  const ts = parseTs(evt.at);
  if (!ts) return null;
  const iv = interventionMap.get(evt.interventionId);
  return {
    id: `se:${evt.id}`,
    type: resolveStatusEventType(evt),
    ts,
    statusBefore: evt.fromStatus ?? undefined,
    statusAfter: evt.toStatus,
    actorUid: evt.actorUid,
    actorRole: evt.actorRole,
    note: evt.note ?? undefined,
    technicianUid:
      evt.toStatus === "assigned" || evt.toStatus === "en_route"
        ? iv?.assignedTechnicianUid ?? undefined
        : undefined,
    ...interventionBase(iv, evt.interventionId),
  };
}

export function synthesizeStatusEvents(
  events: InterventionStatusEvent[],
  interventionMap: Map<string, Intervention>,
): CrmActivityEvent[] {
  return events
    .map((e) => statusEventToCrmEvent(e, interventionMap))
    .filter((e): e is CrmActivityEvent => e !== null);
}

/** Évite doublons entre journal Firestore et champs dénormalisés sur l’intervention. */
export function dedupeCrmEvents(events: CrmActivityEvent[]): CrmActivityEvent[] {
  const byId = new Map<string, CrmActivityEvent>();
  const score = (e: CrmActivityEvent): number => {
    if (e.id.startsWith("se:")) return 4;
    if (e.id.startsWith("crm:")) return 4;
    if (
      e.type === "intervention_technician_declined" ||
      e.type === "intervention_deleted" ||
      e.type === "intervention_returned_to_requests"
    ) {
      return 3;
    }
    if (e.type === "intervention_status" && e.id.endsWith(":status")) return 1;
    return 2;
  };

  for (const e of events) {
    const existing = byId.get(e.id);
    if (!existing || score(e) >= score(existing)) {
      byId.set(e.id, e);
    }
  }

  const bucketSeen = new Set<string>();
  const out: CrmActivityEvent[] = [];
  const sorted = [...byId.values()].sort((a, b) => score(b) - score(a));
  for (const e of sorted) {
    if (e.interventionId && e.ts > 0) {
      const bucket = `${e.interventionId}:${Math.floor(e.ts / 1000)}:${e.type}`;
      if (
        (e.type === "intervention_status" ||
          e.type === "intervention_completed" ||
          e.type === "intervention_billing_updated") &&
        bucketSeen.has(bucket)
      ) {
        continue;
      }
      bucketSeen.add(bucket);
    }
    out.push(e);
  }

  return out.sort((a, b) => b.ts - a.ts);
}
