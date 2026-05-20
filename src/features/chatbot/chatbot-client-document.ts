import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";

/** Action document exécutée côté PWA (route document-action, sans OpenAI). */
export type ChatbotClientDocumentAction =
  | {
      action: "preview";
      interventionId: string;
      documentType?: ChatbotDocumentKind;
    }
  | {
      action: "patch";
      interventionId: string;
      lineIndex?: number;
      unitPriceEur?: number;
      unitPriceCents?: number;
      quantity?: number;
      description?: string;
      clientName?: string;
      previewDocumentType?: "quote" | "invoice";
    }
  | {
      action: "append_billing";
      interventionId: string;
      lines: Array<{
        description: string;
        unitPriceEur: number;
        quantity?: number;
      }>;
      previewDocumentType?: "quote" | "invoice";
    }
  | {
      action: "save_email";
      interventionId: string;
      email: string;
    };
