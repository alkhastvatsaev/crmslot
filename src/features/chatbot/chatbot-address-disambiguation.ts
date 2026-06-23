import type { WorkspaceCopilotSnapshot } from "@/features/copilot";
import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import type { ChatbotPwaResolvedIntervention } from "@/features/chatbot/chatbot-pwa-intent";
import {
  extractChatbotClientQuery,
  matchInterventionInSnapshot,
} from "@/features/chatbot/chatbot-pwa-intent";

export type ChatbotUiMessageLike = {
  role: string;
  content: string;
};

function normalizeMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Message utilisateur = choix numérique seul (ex. « 2 »). */
export function parseNumericChoiceIndex(text: string): number | null {
  const t = text.trim();
  if (!/^\d{1,2}$/.test(t)) return null;
  const n = Number(t);
  if (n < 1 || n > 20) return null;
  return n;
}

/** Liste d’adresses numérotées dans une réponse assistant. */
export function extractNumberedAddressLines(assistantText: string): string[] {
  const lines: string[] = [];
  const re = /^\s*(\d+)\.\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(assistantText)) !== null) {
    const idx = Number(m[1]);
    const addr = m[2].trim();
    if (idx >= 1 && idx <= 20 && addr) lines[idx - 1] = addr;
  }
  return lines.filter(Boolean);
}

export function isAddressDisambiguationPrompt(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /pour laquelle|laquelle de ces|quelles? adresse|choisir|sélectionnez|selectionnez|indiquez le numéro|répondez par le numéro/i.test(
      t
    ) && extractNumberedAddressLines(text).length >= 2
  );
}

function addressMatchScore(addressLine: string, interventionAddress: string): number {
  const a = normalizeMatch(addressLine);
  const b = normalizeMatch(interventionAddress);
  if (!a || !b) return 0;
  if (b.includes(a) || a.includes(b)) return 100;
  const parts = a.split(/\s+/).filter((p) => p.length >= 3);
  if (parts.length === 0) return 0;
  let hits = 0;
  for (const p of parts) {
    if (b.includes(p)) hits += 1;
  }
  return Math.round((hits / parts.length) * 90);
}

export function listInterventionsForClientQuery(
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  clientQuery: string
): ChatbotPwaResolvedIntervention[] {
  if (!snapshot?.interventions?.length || !clientQuery.trim()) return [];

  const q = normalizeMatch(clientQuery);
  const rows = snapshot.interventions.filter((iv) => {
    const name = normalizeMatch(iv.clientName ?? "");
    return name.includes(q) || q.split(/\s+/).some((p) => p.length >= 3 && name.includes(p));
  });

  return [...rows]
    .sort((a, b) => String(a.address ?? "").localeCompare(String(b.address ?? ""), "fr"))
    .map((iv) => ({ interventionId: iv.id, clientName: iv.clientName }));
}

export function mapNumberedAddressesToInterventionIds(
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  addressLines: string[],
  clientQuery?: string | null
): string[] {
  if (!snapshot?.interventions?.length || addressLines.length === 0) return [];

  const pool = clientQuery
    ? snapshot.interventions.filter((iv) => {
        const name = normalizeMatch(iv.clientName ?? "");
        const q = normalizeMatch(clientQuery);
        return name.includes(q) || q.split(/\s+/).some((p) => p.length >= 3 && name.includes(p));
      })
    : snapshot.interventions;

  const ids: string[] = [];
  const used = new Set<string>();

  for (const line of addressLines) {
    let best: { id: string; score: number } | null = null;
    for (const iv of pool) {
      if (used.has(iv.id)) continue;
      const score = addressMatchScore(line, String(iv.address ?? ""));
      if (score > 0 && (!best || score > best.score)) {
        best = { id: iv.id, score };
      }
    }
    if (best && best.score >= 35) {
      ids.push(best.id);
      used.add(best.id);
    }
  }

  if (ids.length === addressLines.length) return ids;

  const fallback = listInterventionsForClientQuery(snapshot, clientQuery ?? "");
  if (fallback.length >= addressLines.length) {
    return fallback.slice(0, addressLines.length).map((r) => r.interventionId);
  }

  return ids;
}

export function findClientQueryFromConversation(messages: ChatbotUiMessageLike[]): string | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const q = extractChatbotClientQuery(m.content);
    if (q) return q;
    if (/facture|devis/i.test(m.content)) {
      const q2 =
        extractChatbotClientQuery(m.content) ??
        m.content.match(/\b([A-ZÀ-Ÿ][a-zà-ÿ\-']{2,})\b/)?.[1];
      if (q2) return q2;
    }
  }
  return null;
}

export function resolveNumericInterventionChoice(
  text: string,
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  messages: ChatbotUiMessageLike[],
  pendingInterventionIds?: string[] | null
): { interventionId: string; documentType: ChatbotDocumentKind } | null {
  const index = parseNumericChoiceIndex(text);
  if (index == null) return null;

  if (pendingInterventionIds?.length && index <= pendingInterventionIds.length) {
    return {
      interventionId: pendingInterventionIds[index - 1],
      documentType: "invoice",
    };
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  /** Priorité au nom cité par l’utilisateur (évite « Pour laquelle… » dans la question assistant). */
  const clientQuery =
    findClientQueryFromConversation(messages) ??
    (lastAssistant?.content ? extractChatbotClientQuery(lastAssistant.content) : null);

  if (lastAssistant?.content) {
    const addressLines = extractNumberedAddressLines(lastAssistant.content);
    if (addressLines.length >= index) {
      const ids = mapNumberedAddressesToInterventionIds(snapshot, addressLines, clientQuery);
      if (ids.length >= index) {
        return { interventionId: ids[index - 1], documentType: "invoice" };
      }
    }
  }

  if (clientQuery) {
    const list = listInterventionsForClientQuery(snapshot, clientQuery);
    if (list.length >= index) {
      return { interventionId: list[index - 1].interventionId, documentType: "invoice" };
    }
  }

  return null;
}

/** Extrait l’intervention depuis une réponse « facture déjà créée … adresse … ». */
export function extractInterventionIdFromInvoiceReply(
  assistantText: string,
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  messages: ChatbotUiMessageLike[],
  pendingInterventionIds?: string[] | null
): string | null {
  if (!snapshot?.interventions?.length) return null;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const numericIndex = lastUser ? parseNumericChoiceIndex(lastUser.content) : null;
  if (numericIndex != null) {
    const choice = resolveNumericInterventionChoice(
      String(numericIndex),
      snapshot,
      messages.slice(0, -1),
      pendingInterventionIds
    );
    if (choice) return choice.interventionId;
  }

  const clientQuery = findClientQueryFromConversation(messages);
  const pool = clientQuery
    ? listInterventionsForClientQuery(snapshot, clientQuery).map((r) =>
        snapshot.interventions.find((iv) => iv.id === r.interventionId)
      )
    : snapshot.interventions;

  const candidates = pool.filter(Boolean) as NonNullable<(typeof pool)[0]>[];

  let best: { id: string; score: number } | null = null;
  const hay = normalizeMatch(assistantText);
  for (const iv of candidates) {
    const addr = normalizeMatch(String(iv.address ?? ""));
    if (!addr) continue;
    const score = hay.includes(addr)
      ? 100
      : addressMatchScore(assistantText, String(iv.address ?? ""));
    if (score > 0 && (!best || score > best.score)) {
      best = { id: iv.id, score };
    }
  }

  if (best && best.score >= 35) return best.id;

  if (clientQuery) {
    const single = matchInterventionInSnapshot(snapshot, clientQuery);
    if (single) return single.interventionId;
  }

  return null;
}

export function shouldAutoPreviewInvoiceInPanel(assistantText: string): boolean {
  const t = assistantText.toLowerCase();
  return (
    /facture/.test(t) &&
    /(déjà|deja|créée|creee|existe|inclut|total de|montant)/i.test(t) &&
    !isAddressDisambiguationPrompt(assistantText)
  );
}

export function buildPendingInterventionIdsFromAssistant(
  assistantText: string,
  snapshot: WorkspaceCopilotSnapshot | null | undefined,
  messages: ChatbotUiMessageLike[]
): string[] | null {
  if (!isAddressDisambiguationPrompt(assistantText)) return null;
  const lines = extractNumberedAddressLines(assistantText);
  if (lines.length < 2) return null;
  const clientQuery =
    findClientQueryFromConversation(messages) ?? extractChatbotClientQuery(assistantText);
  const ids = mapNumberedAddressesToInterventionIds(snapshot, lines, clientQuery);
  return ids.length >= 2 ? ids : null;
}
