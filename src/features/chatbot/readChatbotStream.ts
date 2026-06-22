import type { ChatbotStreamEvent } from "@/features/chatbot/chatbot-types";

export async function readChatbotStream(
  res: Response,
  onEvent: (ev: ChatbotStreamEvent) => void
): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Erreur HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      message = json.error || json.message || message;
    } catch {
      if (text.trim()) message = text.slice(0, 400);
    }
    onEvent({ type: "error", message });
    return;
  }

  if (!res.body) throw new Error("Réponse vide du serveur");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onEvent(JSON.parse(line) as ChatbotStreamEvent);
      } catch {
        /* ligne non JSON */
      }
    }
  }
  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer) as ChatbotStreamEvent);
    } catch {
      /* ignore */
    }
  }
}
