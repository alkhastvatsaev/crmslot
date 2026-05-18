export type InboxNotificationType =
  | "intervention_assigned"
  | "intervention_status_changed"
  | "sla_warning"
  | "sla_breach"
  | "maintenance_due"
  | "quote_responded"
  | "stock_low"
  | "claim_opened"
  | "system";

export interface InboxNotification {
  id: string;
  companyId: string;
  recipientUid: string;
  type: InboxNotificationType;
  title: string;
  body: string;
  /** Deep-link path inside the app */
  actionPath?: string | null;
  /** Related entity IDs for context */
  interventionId?: string | null;
  read: boolean;
  createdAt: string;
}

export const INBOX_TYPE_ICONS: Record<InboxNotificationType, string> = {
  intervention_assigned: "👷",
  intervention_status_changed: "🔄",
  sla_warning: "⚠️",
  sla_breach: "🚨",
  maintenance_due: "🔧",
  quote_responded: "📝",
  stock_low: "📦",
  claim_opened: "📣",
  system: "ℹ️",
};
