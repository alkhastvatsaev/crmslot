/**
 * Outils autorisés par agent hub (scopes serveur — le client ne peut pas les étendre).
 * UI : focus_stock_item, focus_billing_case, open_crm_dossier, focus_intervention_document
 */

export const MATERIAL_AGENT_TOOL_SCOPE = [
  "get_workspace_summary",
  "list_stock_alerts",
  "list_company_material_orders",
  "list_material_orders",
  "list_supplier_orders",
  "search_lecot_products",
  "order_lecot_parts",
  "approve_material_orders",
  "focus_stock_item",
] as const;

export const CRM_HISTORY_AGENT_TOOL_SCOPE = [
  "get_workspace_summary",
  "search_workspace",
  "list_interventions",
  "get_intervention_detail",
  "list_clients",
  "get_client_detail",
  "list_company_material_orders",
  "list_material_orders",
  "list_supplier_orders",
  "list_intervention_emails",
  "list_portal_chat",
  "statistiques_periode",
  "add_timeline_comment",
  "update_intervention_status",
  "send_intervention_email",
  "save_client_email",
  "open_crm_dossier",
] as const;

export const BILLING_HUB_AGENT_TOOL_SCOPE = [
  "search_workspace",
  "list_interventions",
  "get_intervention_detail",
  "get_intervention_billing",
  "patch_intervention_billing",
  "update_intervention_billing",
  "focus_intervention_document",
  "focus_billing_case",
  "list_intervention_emails",
  "send_intervention_email",
  "save_client_email",
  "list_quotes",
] as const;

/** Outils UI hub : fin de tour immédiate + effets stream (pas focus_intervention_document). */
export const HUB_AGENT_IMMEDIATE_UI_TOOLS = new Set([
  "focus_stock_item",
  "focus_billing_case",
  "open_crm_dossier",
]);
