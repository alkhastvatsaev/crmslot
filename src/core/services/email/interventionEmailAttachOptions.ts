import { isChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import type { InterventionEmailPdfKind } from "@/core/services/email/interventionEmailPdfAttachment";

export function parseAttachDocumentType(raw: unknown): InterventionEmailPdfKind | "none" {
  if (raw === "none" || raw === false) return "none";
  const s = String(raw ?? "invoice").trim();
  if (s === "none") return "none";
  if (isChatbotDocumentKind(s) && s !== "report" && s !== "material_order") return s;
  return "invoice";
}
