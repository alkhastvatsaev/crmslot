import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";

export type ChatbotChatRole = "user" | "assistant";

export type ChatbotUiMessage = {
  id: string;
  role: ChatbotChatRole;
  content: string;
  createdAt: number;
  /** Boutons cliquables (commande Lecot, réponses courtes, etc.). */
  actions?: ChatbotQuickAction[];
};

export type ChatbotConversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatbotUiMessage[];
  /** Messages bruts Anthropic (tool_use / tool_result) pour reprise API */
  apiMessages?: unknown[];
};

export type ChatbotPendingTool = {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
  summary: string;
};

export type ChatbotStreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; tool: string; label: string }
  | { type: "tool_end"; tool: string }
  | { type: "tool_pending"; pending: ChatbotPendingTool }
  | {
      type: "document_preview";
      interventionId: string;
      documentType: ChatbotDocumentKind;
    }
  | {
      type: "supplier_orders_panel";
      highlightOrderId: string;
      materialOrderId?: string | null;
      previewOrder?: import("@/features/suppliers/types").SupplierOrder;
    }
  | { type: "supplier_order_pdf"; companyId: string; orderId: string }
  | { type: "registry_refresh" }
  | {
      type: "focus_stock_hub";
      companyId: string;
      stockItemId?: string | null;
      filter?: "all" | "low" | "orders" | "lecot";
      searchQuery?: string | null;
    }
  | { type: "quick_actions"; actions: ChatbotQuickAction[] }
  | {
      type: "focus_billing_case";
      interventionId: string | null;
      filter?: "all" | "unpaid" | "pending" | "paid" | "to_bill";
    }
  | { type: "open_crm_dossier"; interventionId: string }
  | { type: "export_accounting_csv" }
  | { type: "export_payroll_csv" }
  | { type: "material_order_client"; clientName: string }
  | { type: "done"; apiMessages?: unknown[] }
  | { type: "error"; message: string };

export type ChatbotStreamEmit = (event: ChatbotStreamEvent) => void;
