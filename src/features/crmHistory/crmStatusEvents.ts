import type { Intervention } from "@/features/interventions/types";
import type { InterventionStatusEvent } from "@/features/interventions/workflow/interventionWorkflowTypes";
import type { CrmActivityEvent, CrmEventType } from "./crmActivityTypes";
import { parseTs } from "./crmActivityLog";

// Prefixes that identify events from real Firestore documents (never synthesized from snapshots).
const REAL_EVENT_PREFIXES = [
  "crm:",
  "se:",
  "email:",
  "commission:",
  "mo:",
  "so:",
  "ivana:",
] as const;

function isRealEvent(e: CrmActivityEvent): boolean {
  return REAL_EVENT_PREFIXES.some((p) => e.id.startsWith(p));
}

function interventionBase(
  iv: Intervention | undefined,
  interventionId: string
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
  interventionMap: Map<string, Intervention>
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
        ? (iv?.assignedTechnicianUid ?? undefined)
        : undefined,
    ...interventionBase(iv, evt.interventionId),
  };
}

export function synthesizeStatusEvents(
  events: InterventionStatusEvent[],
  interventionMap: Map<string, Intervention>
): CrmActivityEvent[] {
  return events
    .map((e) => statusEventToCrmEvent(e, interventionMap))
    .filter((e): e is CrmActivityEvent => e !== null);
}

/**
 * Déduplique les événements CRM en préservant TOUS les événements réels (crm:, se:, email:, etc.).
 * Seuls les événements synthétisés (depuis les champs snapshot d’une intervention) sont retirés
 * quand un événement réel couvre déjà le même slot (interventionId + secondes + type).
 * Rien n’est jamais supprimé côté Firestore — uniquement des doublons d’affichage.
 */
export function dedupeCrmEvents(events: CrmActivityEvent[]): CrmActivityEvent[] {
  // Pass 1 : dédup par ID exact — un événement réel prime toujours sur un synthétique même ID.
  const byId = new Map<string, CrmActivityEvent>();
  for (const e of events) {
    const existing = byId.get(e.id);
    if (!existing || (isRealEvent(e) && !isRealEvent(existing))) {
      byId.set(e.id, e);
    }
  }

  // Pass 2 : collecter les buckets couverts par des événements réels.
  const realBuckets = new Set<string>();
  for (const e of byId.values()) {
    if (isRealEvent(e) && e.interventionId && e.ts > 0) {
      realBuckets.add(`${e.interventionId}:${Math.floor(e.ts / 1000)}:${e.type}`);
    }
  }

  // Pass 3 : conserver tous les réels ; retirer les synthétiques couverts par un réel.
  return [...byId.values()]
    .filter((e) => {
      if (isRealEvent(e)) return true;
      if (!e.interventionId || e.ts <= 0) return true;
      return !realBuckets.has(`${e.interventionId}:${Math.floor(e.ts / 1000)}:${e.type}`);
    })
    .sort((a, b) => b.ts - a.ts);
}
