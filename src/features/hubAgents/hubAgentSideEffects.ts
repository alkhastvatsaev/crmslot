import { emitChatbotOrderRegisteredEvents } from "@/features/chatbot/chatbot-order-side-effect";
import { extractDocumentPreviewFromResult } from "@/features/chatbot/chatbot-document-side-effect";
import type { ChatbotStreamEmit } from "@/features/chatbot/chatbot-types";
import type { CompanyStockFilter } from "@/features/featureHub/filterCompanyStock";
import type { BillingPaymentFilter } from "@/features/billingHub/billingHubMetrics";

function okResult(result: unknown): result is Record<string, unknown> {
  return Boolean(result && typeof result === "object" && (result as { ok?: boolean }).ok);
}

export function emitHubAgentToolSideEffects(
  toolName: string,
  result: unknown,
  emit: ChatbotStreamEmit,
  companyId: string
): void {
  if (toolName === "order_lecot_parts") {
    emitChatbotOrderRegisteredEvents(emit, companyId, result);
    return;
  }

  if (toolName === "approve_material_orders" && okResult(result)) {
    emit({ type: "registry_refresh" });
    return;
  }

  if (toolName === "trigger_accounting_export") {
    emit({ type: "export_accounting_csv" });
    return;
  }

  if (toolName === "trigger_payroll_export") {
    emit({ type: "export_payroll_csv" });
    return;
  }

  const preview = extractDocumentPreviewFromResult(result);
  if (preview) {
    emit({ type: "document_preview", ...preview });
  }

  if (!okResult(result)) return;

  if (toolName === "focus_stock_item") {
    const filter = result.filter;
    const stockFilter =
      filter === "low" || filter === "orders" || filter === "lecot" || filter === "all"
        ? filter
        : undefined;
    emit({
      type: "focus_stock_hub",
      companyId,
      stockItemId: typeof result.stockItemId === "string" ? result.stockItemId : null,
      filter: stockFilter,
      searchQuery: typeof result.searchQuery === "string" ? result.searchQuery : null,
    });
    return;
  }

  if (toolName === "focus_billing_case") {
    const f = result.filter;
    const billingFilter =
      f === "unpaid" || f === "pending" || f === "paid" || f === "to_bill" || f === "all"
        ? f
        : undefined;
    emit({
      type: "focus_billing_case",
      interventionId:
        typeof result.interventionId === "string" ? result.interventionId.trim() || null : null,
      filter: billingFilter,
    });
    return;
  }

  if (toolName === "open_crm_dossier" && typeof result.interventionId === "string") {
    const id = result.interventionId.trim();
    if (id) emit({ type: "open_crm_dossier", interventionId: id });
  }
}

export type FocusBillingCaseEvent = {
  type: "focus_billing_case";
  interventionId: string | null;
  filter?: BillingPaymentFilter;
};

export type OpenCrmDossierEvent = {
  type: "open_crm_dossier";
  interventionId: string;
};

export type FocusStockFilter = CompanyStockFilter;

export function hubUiToolSuccessMessage(toolName: string, result: unknown): string {
  if (!okResult(result)) return "Action terminée.";
  const r = result as Record<string, unknown>;
  switch (toolName) {
    case "focus_stock_item":
      return r.stockItemId
        ? `Article ${r.stockItemId} mis en avant dans l'inventaire.`
        : "Filtre stock appliqué dans l'inventaire.";
    case "focus_billing_case":
      return r.interventionId
        ? `Dossier ${r.interventionId} sélectionné dans la facturation.`
        : "Liste facturation filtrée.";
    case "open_crm_dossier":
      return `Ouverture du dossier ${r.interventionId} dans le back-office.`;
    default:
      return "Action interface effectuée.";
  }
}
