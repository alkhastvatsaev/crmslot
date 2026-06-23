import type { ChatbotInvoiceRow } from "@/features/chatbot/chatbotInvoiceRows";
import type { SupplierOrder } from "@/features/suppliers/types";

export type DocumentsSearchKindFilter = "all" | "invoice" | "order";

export type ParsedDocumentsSearchQuery = {
  kindFilter: DocumentsSearchKindFilter;
  textTokens: string[];
  hasQuery: boolean;
};

export type ChatbotDocumentListItem =
  | { kind: "invoice"; createdAtMs: number; invoice: ChatbotInvoiceRow }
  | { kind: "order"; createdAtMs: number; order: SupplierOrder };
