import type { CrmActivityEvent, CrmPeriodFilter, CrmTypeFilter } from "./crmActivityTypes";

export const PERIOD_MS: Record<Exclude<CrmPeriodFilter, "all">, number> = {
  today: 86_400_000,
  week: 7 * 86_400_000,
  month: 30 * 86_400_000,
};

export function applyPeriod(events: CrmActivityEvent[], period: CrmPeriodFilter): CrmActivityEvent[] {
  if (period === "all") return events;
  const cutoff = Date.now() - PERIOD_MS[period];
  return events.filter((e) => e.ts >= cutoff);
}

export function applyTypeFilter(
  events: CrmActivityEvent[],
  filter: CrmTypeFilter,
): CrmActivityEvent[] {
  if (filter === "all") return events;
  if (filter === "interventions")
    return events.filter(
      (e) =>
        e.type.startsWith("intervention_") ||
        e.type === "chatbot_intervention_status" ||
        e.type === "chatbot_timeline_comment" ||
        e.type === "chatbot_write_action" ||
        e.type === "quote_created" ||
        e.type === "quote_status_changed",
    );
  if (filter === "materials")
    return events.filter(
      (e) =>
        e.type === "material_ordered" ||
        e.type === "material_order_status_changed" ||
        e.type === "supplier_ordered" ||
        e.type === "supplier_order_lecot",
    );
  if (filter === "suppliers")
    return events.filter(
      (e) => e.type === "supplier_ordered" || e.type === "supplier_order_lecot",
    );
  if (filter === "communications")
    return events.filter(
      (e) =>
        e.type === "email_sent" ||
        e.type === "email_received" ||
        e.type === "commission_calculated" ||
        e.type === "ivana_chat_message" ||
        e.type === "chatbot_email_sent" ||
        e.type === "chatbot_gmail_action",
    );
  return events;
}

export function applySearch(events: CrmActivityEvent[], q: string): CrmActivityEvent[] {
  const term = q.trim().toLowerCase();
  if (!term) return events;
  return events.filter(
    (e) =>
      e.clientName?.toLowerCase().includes(term) ||
      e.address?.toLowerCase().includes(term) ||
      e.interventionTitle?.toLowerCase().includes(term) ||
      e.orderLabel?.toLowerCase().includes(term) ||
      e.emailSubject?.toLowerCase().includes(term) ||
      e.emailFrom?.toLowerCase().includes(term) ||
      e.note?.toLowerCase().includes(term) ||
      e.actorRole?.toLowerCase().includes(term),
  );
}
