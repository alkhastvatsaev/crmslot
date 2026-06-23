export const CHATBOT_WRITE_TOOLS = new Set([
  "update_intervention_status",
  "assign_technician",
  "update_intervention_schedule",
  "add_timeline_comment",
  "send_intervention_email",
  "patch_intervention_billing",
  "update_intervention_billing",
  "order_lecot_parts",
  "approve_material_orders",
  "send_gmail_reply",
  "link_gmail_to_intervention",
]);

export function isChatbotWriteTool(name: string): boolean {
  return CHATBOT_WRITE_TOOLS.has(name);
}
