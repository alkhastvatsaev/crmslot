import { addDoc, collection, type Firestore, type WriteBatch, doc } from "firebase/firestore";
import type { Intervention } from "@/features/interventions/types";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";
import type { CrmActivityEvent, CrmEventType } from "./crmActivityTypes";

export type CompanyCrmActivityKind =
  | "intervention_created"
  | "intervention_deleted"
  | "intervention_technician_declined"
  | "intervention_returned_to_requests"
  | "intervention_assigned"
  | "intervention_report_validated"
  | "intervention_invoiced"
  | "intervention_cancelled"
  | "intervention_schedule_updated"
  | "intervention_billing_updated"
  | "intervention_payment_updated"
  | "intervention_terrain_report_received"
  | "bridged_report_dismissed"
  | "ivana_chat_message"
  | "material_order_placed"
  | "material_order_status_changed"
  | "supplier_order_lecot"
  | "chatbot_intervention_status"
  | "chatbot_timeline_comment"
  | "chatbot_email_sent"
  | "chatbot_gmail_action"
  | "chatbot_write_action"
  | "quote_created"
  | "quote_status_changed";

export type CompanyCrmActivityDoc = {
  companyId: string;
  kind: CompanyCrmActivityKind;
  at: string;
  actorUid: string;
  actorRole: WorkflowOwnerRole;
  interventionId?: string | null;
  interventionTitle?: string | null;
  clientName?: string | null;
  address?: string | null;
  statusBefore?: string | null;
  statusAfter?: string | null;
  note?: string | null;
};

function crmActivityCollection(db: Firestore, companyId: string) {
  return collection(db, "companies", companyId.trim(), "crm_activity");
}

function interventionContext(
  iv: Pick<
    Intervention,
    | "id"
    | "title"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientCompanyName"
    | "address"
  >
): Pick<CompanyCrmActivityDoc, "interventionId" | "interventionTitle" | "clientName" | "address"> {
  const clientName =
    iv.clientCompanyName ??
    iv.clientName ??
    ([iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ").trim() || undefined);
  return {
    interventionId: iv.id,
    interventionTitle: iv.title,
    clientName,
    address: iv.address,
  };
}

export function buildCompanyCrmActivityPayload(
  companyId: string,
  kind: CompanyCrmActivityKind,
  actor: { uid: string; role: WorkflowOwnerRole },
  iv: Pick<
    Intervention,
    | "id"
    | "title"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientCompanyName"
    | "address"
    | "status"
  >,
  extra?: Partial<Pick<CompanyCrmActivityDoc, "statusBefore" | "statusAfter" | "note">>,
  now = new Date()
): CompanyCrmActivityDoc {
  return {
    companyId: companyId.trim(),
    kind,
    at: now.toISOString(),
    actorUid: actor.uid,
    actorRole: actor.role,
    statusBefore: iv.status ?? null,
    ...interventionContext(iv),
    ...extra,
  };
}

export function appendCompanyCrmActivityToBatch(
  batch: WriteBatch,
  db: Firestore,
  payload: CompanyCrmActivityDoc
): string {
  const ref = doc(crmActivityCollection(db, payload.companyId));
  batch.set(ref, payload);
  return ref.id;
}

export async function logCompanyCrmActivity(
  db: Firestore,
  payload: CompanyCrmActivityDoc
): Promise<string> {
  const ref = await addDoc(crmActivityCollection(db, payload.companyId), payload);
  return ref.id;
}

const KIND_TO_EVENT_TYPE: Record<CompanyCrmActivityKind, CrmEventType> = {
  intervention_created: "intervention_created",
  intervention_deleted: "intervention_deleted",
  intervention_technician_declined: "intervention_technician_declined",
  intervention_returned_to_requests: "intervention_returned_to_requests",
  intervention_assigned: "intervention_assigned",
  intervention_report_validated: "intervention_report_validated",
  intervention_invoiced: "intervention_invoiced",
  intervention_cancelled: "intervention_cancelled",
  intervention_schedule_updated: "intervention_schedule_updated",
  intervention_billing_updated: "intervention_billing_updated",
  intervention_payment_updated: "intervention_payment_updated",
  intervention_terrain_report_received: "intervention_terrain_report_received",
  bridged_report_dismissed: "bridged_report_dismissed",
  ivana_chat_message: "ivana_chat_message",
  material_order_placed: "material_ordered",
  material_order_status_changed: "material_order_status_changed",
  supplier_order_lecot: "supplier_order_lecot",
  chatbot_intervention_status: "chatbot_intervention_status",
  chatbot_timeline_comment: "chatbot_timeline_comment",
  chatbot_email_sent: "chatbot_email_sent",
  chatbot_gmail_action: "chatbot_gmail_action",
  chatbot_write_action: "chatbot_write_action",
  quote_created: "quote_created",
  quote_status_changed: "quote_status_changed",
};

export function parseTs(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : 0;
}

export function synthesizeCompanyCrmLogEvents(
  rows: Array<CompanyCrmActivityDoc & { id: string }>
): CrmActivityEvent[] {
  return rows.map((row) => ({
    id: `crm:${row.id}`,
    type: KIND_TO_EVENT_TYPE[row.kind],
    ts: parseTs(row.at),
    interventionId: row.interventionId ?? undefined,
    interventionTitle: row.interventionTitle ?? undefined,
    clientName: row.clientName ?? undefined,
    address: row.address ?? undefined,
    statusBefore: row.statusBefore ?? undefined,
    statusAfter: row.statusAfter ?? undefined,
    actorUid: row.actorUid,
    actorRole: row.actorRole,
    note: row.note ?? undefined,
  }));
}
