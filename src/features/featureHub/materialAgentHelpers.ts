import type { CompanyStockAgentContext } from "@/features/featureHub/companyStockAgentTypes";

export const MATERIAL_AGENT_STORAGE_KEY = "crmslot-material-agent-v1";

export const MATERIAL_AGENT_OFF_TOPIC_TEXT =
  "Je suis l'Agent Matériel — je traite uniquement le stock et les commandes matériel. Pour toute autre question, utilisez l'Assistant IA.";

export const MATERIAL_AGENT_OFF_TOPIC_SUGGESTIONS = [
  "État du stock",
  "Alertes",
  "Recherche article",
];

export function extractMaterialAgentSuggestions(text: string): string[] {
  const out: string[] = [];
  const re = /<suggestion>(.*?)<\/suggestion>/gi;
  let m = re.exec(text);
  while (m) {
    const s = m[1].trim();
    if (s) out.push(s);
    m = re.exec(text);
  }
  return out;
}

export function stripMaterialAgentSuggestions(text: string): string {
  return text.replace(/<suggestion>.*?<\/suggestion>/gi, "").trim();
}

export function nextMaterialAgentMessageId() {
  return `mat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadMaterialAgentApiHistory(uid: string, companyId: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${MATERIAL_AGENT_STORAGE_KEY}:api:${uid}:${companyId}`);
    return raw ? (JSON.parse(raw) as unknown[]) : [];
  } catch {
    return [];
  }
}

export function saveMaterialAgentApiHistory(uid: string, companyId: string, msgs: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${MATERIAL_AGENT_STORAGE_KEY}:api:${uid}:${companyId}`,
      JSON.stringify(msgs.slice(-80))
    );
  } catch {
    /* quota */
  }
}

export function buildMaterialAgentStockSnapshot(ctx: CompanyStockAgentContext): string | null {
  if (!ctx.items.length) return null;
  const m = ctx.metrics;
  const summary = {
    totalSkus: m.totalSkus,
    coveragePct: m.coveragePct,
    outCount: m.outCount,
    lowCount: m.lowCount,
    pendingFieldOrders: m.pendingFieldOrders,
    waitingMaterialJobs: m.waitingMaterialJobs,
    items: ctx.items.slice(0, 20).map((it) => ({
      id: it.id,
      ref: it.reference ?? null,
      desc: it.description,
      qty: it.quantity,
      threshold: it.alertThreshold,
    })),
  };
  try {
    return JSON.stringify(summary);
  } catch {
    return null;
  }
}
