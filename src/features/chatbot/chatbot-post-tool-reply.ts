import { documentToolSuccessMessage } from "@/features/chatbot/chatbot-document-side-effect";

/** Texte assistant après exécution d'un outil — évite un 2e appel OpenAI. */
export function buildChatbotPostToolReply(toolName: string, result: unknown): string {
  const fromHelper = documentToolSuccessMessage(toolName, result);
  if (fromHelper && !fromHelper.startsWith("Erreur")) return fromHelper;
  if (result && typeof result === "object" && "error" in (result as object)) {
    return String((result as { error?: string }).error ?? "Erreur lors de l'action.");
  }
  if (result && typeof result === "object" && "message" in (result as object)) {
    const msg = String((result as { message?: string }).message ?? "").trim();
    if (msg) return msg;
  }
  return "C'est enregistré.";
}
