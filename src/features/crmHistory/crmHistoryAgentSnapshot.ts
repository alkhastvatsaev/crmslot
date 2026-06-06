import type { CrmActivityEvent } from "@/features/crmHistory/crmActivityTypes";
import type { QmKpiSnapshot } from "./crmHistoryAgentSystemPrompt";

export function buildCrmHistoryActivitySnapshot(events: CrmActivityEvent[]): string | null {
  if (!events.length) return null;
  try {
    return JSON.stringify({
      totalEvents: events.length,
      recent: events.slice(0, 30).map((e) => ({
        type: e.type,
        ts: e.ts,
        interventionId: e.interventionId ?? null,
        clientName: e.clientName ?? null,
        note: e.note ?? null,
      })),
    });
  } catch {
    return null;
  }
}

export function buildQmKpiSnapshot(events: CrmActivityEvent[], dateLabel: string): QmKpiSnapshot {
  let created = 0,
    completed = 0,
    invoiced = 0;
  let cancelled = 0,
    declined = 0,
    returned = 0;
  let materials = 0,
    emails = 0;
  let quotes = 0,
    assigned = 0,
    reports = 0,
    scheduled = 0,
    chatbot = 0;
  let orderCentsTotal = 0;

  for (const e of events) {
    if (e.type === "intervention_created") created++;
    else if (e.type === "intervention_completed") completed++;
    else if (e.type === "intervention_invoiced") invoiced++;
    else if (e.type === "intervention_cancelled") cancelled++;
    else if (e.type === "intervention_technician_declined") declined++;
    else if (e.type === "intervention_returned_to_requests") returned++;
    else if (
      e.type === "material_ordered" ||
      e.type === "supplier_ordered" ||
      e.type === "supplier_order_lecot"
    )
      materials++;
    else if (e.type === "email_sent" || e.type === "email_received") emails++;
    else if (e.type === "quote_created" || e.type === "quote_status_changed") quotes++;
    else if (e.type === "intervention_assigned") assigned++;
    else if (
      e.type === "intervention_report_validated" ||
      e.type === "intervention_terrain_report_received"
    )
      reports++;
    else if (e.type === "intervention_schedule_updated") scheduled++;

    if (
      e.type === "chatbot_intervention_status" ||
      e.type === "chatbot_timeline_comment" ||
      e.type === "chatbot_email_sent" ||
      e.type === "chatbot_gmail_action" ||
      e.type === "chatbot_write_action"
    )
      chatbot++;

    if (e.orderTotalCents) orderCentsTotal += e.orderTotalCents;
  }

  const rate = created > 0 ? Math.round((completed / created) * 100) : null;

  return {
    created,
    completed,
    rate,
    invoiced,
    cancelled,
    declined,
    returned,
    materials,
    emails,
    quotes,
    assigned,
    reports,
    scheduled,
    chatbot,
    orderCentsTotal,
    dateLabel,
  };
}
