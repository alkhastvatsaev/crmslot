import { statusLabelKey } from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";
import type { CrmActivityEvent, CrmEventType } from "./crmActivityTypes";

export type CrmActivityEventDetail = {
  lines: string[];
};

type Translate = (key: string) => string;

function fieldLine(
  t: Translate,
  labelKey: string,
  value: string | undefined | null
): string | null {
  const v = value?.trim();
  if (!v) return null;
  return `${t(labelKey)} : ${v}`;
}

function formatEurosFromCents(cents: number | undefined): string | null {
  if (cents == null) return null;
  return `${(cents / 100).toFixed(2)} €`;
}

function formatEuros(amount: number | undefined): string | null {
  if (amount == null) return null;
  return `${amount.toFixed(2)} €`;
}

function statusLabel(
  event: CrmActivityEvent,
  code: string | undefined,
  t: Translate
): string | null {
  if (!code) return null;
  if (event.type === "quote_status_changed") {
    return String(t(`quotes.status.${code}` as "quotes.status.draft")) || code;
  }
  const key = statusLabelKey(code as Intervention["status"]);
  return String(t(key));
}

function commonContextLines(event: CrmActivityEvent, t: Translate): string[] {
  const lines: string[] = [];
  const push = (line: string | null) => {
    if (line) lines.push(line);
  };
  push(fieldLine(t, "crmHistory.detail.label.intervention", event.interventionTitle));
  push(fieldLine(t, "crmHistory.detail.label.client", event.clientName));
  push(fieldLine(t, "crmHistory.detail.label.address", event.address));
  push(fieldLine(t, "crmHistory.detail.label.order", event.orderLabel));
  push(
    fieldLine(
      t,
      "crmHistory.detail.label.order_amount",
      formatEurosFromCents(event.orderTotalCents)
    )
  );
  return lines;
}

const DETAIL_BODY_KEY: Record<CrmEventType, string> = {
  intervention_created: "crmHistory.detail.body.intervention_created",
  intervention_assigned: "crmHistory.detail.body.intervention_assigned",
  intervention_status: "crmHistory.detail.body.intervention_status",
  intervention_completed: "crmHistory.detail.body.intervention_completed",
  intervention_invoiced: "crmHistory.detail.body.intervention_invoiced",
  intervention_technician_declined: "crmHistory.detail.body.intervention_technician_declined",
  intervention_returned_to_requests: "crmHistory.detail.body.intervention_returned_to_requests",
  intervention_deleted: "crmHistory.detail.body.intervention_deleted",
  intervention_report_validated: "crmHistory.detail.body.intervention_report_validated",
  intervention_cancelled: "crmHistory.detail.body.intervention_cancelled",
  intervention_schedule_updated: "crmHistory.detail.body.intervention_schedule_updated",
  intervention_billing_updated: "crmHistory.detail.body.intervention_billing_updated",
  intervention_payment_updated: "crmHistory.detail.body.intervention_payment_updated",
  intervention_terrain_report_received:
    "crmHistory.detail.body.intervention_terrain_report_received",
  bridged_report_dismissed: "crmHistory.detail.body.bridged_report_dismissed",
  ivana_chat_message: "crmHistory.detail.body.ivana_chat_message",
  material_order_status_changed: "crmHistory.detail.body.material_order_status_changed",
  supplier_order_lecot: "crmHistory.detail.body.supplier_order_lecot",
  chatbot_intervention_status: "crmHistory.detail.body.chatbot_intervention_status",
  chatbot_timeline_comment: "crmHistory.detail.body.chatbot_timeline_comment",
  chatbot_email_sent: "crmHistory.detail.body.chatbot_email_sent",
  chatbot_gmail_action: "crmHistory.detail.body.chatbot_gmail_action",
  chatbot_write_action: "crmHistory.detail.body.chatbot_write_action",
  material_ordered: "crmHistory.detail.body.material_ordered",
  supplier_ordered: "crmHistory.detail.body.supplier_ordered",
  email_sent: "crmHistory.detail.body.email_sent",
  email_received: "crmHistory.detail.body.email_received",
  commission_calculated: "crmHistory.detail.body.commission_calculated",
  quote_created: "crmHistory.detail.body.quote_created",
  quote_status_changed: "crmHistory.detail.body.quote_status_changed",
  page_navigated: "crmHistory.detail.body.page_navigated",
  intervention_viewed: "crmHistory.detail.body.intervention_viewed",
  email_viewed: "crmHistory.detail.body.email_viewed",
  user_session_start: "crmHistory.detail.body.user_session_start",
};

/** Texte explicatif pour le panneau droit de l’historique CRM. */
export function buildCrmActivityEventDetail(
  event: CrmActivityEvent,
  t: Translate
): CrmActivityEventDetail {
  const lines: string[] = [t(DETAIL_BODY_KEY[event.type])];

  const actorKey = event.actorRole ? (`crmHistory.actor.${event.actorRole}` as const) : null;
  if (actorKey) {
    const actorLine = fieldLine(t, "crmHistory.detail.label.actor", t(actorKey));
    if (actorLine) lines.push(actorLine);
  }

  if (event.statusBefore || event.statusAfter) {
    const before = statusLabel(event, event.statusBefore, t);
    const after = statusLabel(event, event.statusAfter, t);
    if (before && after) {
      lines.push(
        t("crmHistory.detail.status_transition")
          .replace("{before}", before)
          .replace("{after}", after)
      );
    } else if (after) {
      lines.push(fieldLine(t, "crmHistory.detail.label.status", after)!);
    } else if (before) {
      lines.push(fieldLine(t, "crmHistory.detail.label.status", before)!);
    }
  }

  if (event.materialOrderStatus) {
    lines.push(fieldLine(t, "crmHistory.detail.label.material_status", event.materialOrderStatus)!);
  }

  if (event.chatRole) {
    lines.push(
      fieldLine(
        t,
        "crmHistory.detail.label.chat_role",
        t(`crmHistory.detail.chat_role.${event.chatRole}`)
      )!
    );
  }

  if (event.emailSubject) {
    lines.push(fieldLine(t, "crmHistory.detail.label.email_subject", event.emailSubject)!);
  }
  if (
    event.type === "email_sent" ||
    event.type === "email_received" ||
    event.type === "chatbot_email_sent"
  ) {
    if (event.emailFrom)
      lines.push(fieldLine(t, "crmHistory.detail.label.email_from", event.emailFrom)!);
    if (event.emailTo) lines.push(fieldLine(t, "crmHistory.detail.label.email_to", event.emailTo)!);
  }

  if (event.commissionAmountEuros != null) {
    lines.push(
      fieldLine(t, "crmHistory.detail.label.commission", formatEuros(event.commissionAmountEuros))!
    );
  }
  if (event.commissionAction) {
    lines.push(fieldLine(t, "crmHistory.detail.label.commission_action", event.commissionAction)!);
  }

  if (event.technicianUid) {
    lines.push(fieldLine(t, "crmHistory.detail.label.technician", event.technicianUid)!);
  }

  if (event.orderId) {
    lines.push(fieldLine(t, "crmHistory.detail.label.order_id", event.orderId)!);
  }

  if (event.note?.trim()) {
    lines.push(fieldLine(t, "crmHistory.detail.label.note", event.note)!);
  }

  lines.push(...commonContextLines(event, t));

  return { lines: lines.filter(Boolean) };
}
