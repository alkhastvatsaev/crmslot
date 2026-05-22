export type CrmEventType =
  | "intervention_created"
  | "intervention_assigned"
  | "intervention_status"
  | "intervention_completed"
  | "intervention_invoiced"
  | "intervention_technician_declined"
  | "intervention_returned_to_requests"
  | "intervention_deleted"
  | "intervention_report_validated"
  | "intervention_cancelled"
  | "intervention_schedule_updated"
  | "intervention_billing_updated"
  | "intervention_payment_updated"
  | "intervention_terrain_report_received"
  | "bridged_report_dismissed"
  | "ivana_chat_message"
  | "material_order_status_changed"
  | "supplier_order_lecot"
  | "chatbot_intervention_status"
  | "chatbot_timeline_comment"
  | "chatbot_email_sent"
  | "chatbot_gmail_action"
  | "chatbot_write_action"
  | "material_ordered"
  | "supplier_ordered"
  | "email_sent"
  | "email_received"
  | "commission_calculated"
  | "quote_created"
  | "quote_status_changed";

export type CrmPeriodFilter = "today" | "week" | "month" | "all";
export type CrmTypeFilter = "all" | "interventions" | "materials" | "suppliers" | "communications";

export interface CrmActivityEvent {
  id: string;
  type: CrmEventType;
  ts: number;
  interventionId?: string;
  interventionTitle?: string;
  clientName?: string;
  address?: string;
  statusBefore?: string;
  statusAfter?: string;
  technicianUid?: string;
  orderId?: string;
  orderLabel?: string;
  orderTotalCents?: number;
  /** Email-specific */
  emailSubject?: string;
  emailFrom?: string;
  emailTo?: string;
  /** Commission-specific */
  commissionAmountEuros?: number;
  commissionAction?: string;
  /** Journal workflow / CRM */
  actorUid?: string;
  actorRole?: string;
  note?: string;
  /** Chat Ivana / matériel */
  chatRole?: "client" | "staff";
  materialOrderStatus?: string;
}
