/** Types de documents PDF affichables dans le rail droit (page Chatbot). */
export type ChatbotDocumentKind = "quote" | "invoice" | "report" | "material_order";

export const CHATBOT_DOCUMENT_LABELS: Record<ChatbotDocumentKind, string> = {
  quote: "Devis / bon",
  invoice: "Facture",
  report: "Rapport d'intervention",
  material_order: "Commandes de matériel",
};

export function isChatbotDocumentKind(v: string): v is ChatbotDocumentKind {
  return v === "quote" || v === "invoice" || v === "report" || v === "material_order";
}

export function documentPdfApiPath(interventionId: string, kind: ChatbotDocumentKind): string {
  return `/api/interventions/${encodeURIComponent(interventionId)}/document-pdf?type=${kind}`;
}

export function supplierOrderPdfApiPath(companyId: string, orderId: string): string {
  return `/api/companies/${encodeURIComponent(companyId)}/supplier-orders/${encodeURIComponent(orderId)}/pdf`;
}
