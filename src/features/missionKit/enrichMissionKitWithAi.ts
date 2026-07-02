import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { BuildMissionKitInput, MissionKit, MissionKitItem } from "@/features/missionKit/types";
import { buildMissionKit } from "@/features/missionKit/buildMissionKit";

export type MissionKitAiItem = {
  label: string;
  reference?: string;
  quantity?: number;
  confidence?: number;
};

export type MissionKitAiResponse = {
  items?: MissionKitAiItem[];
  summary?: string;
};

function slugId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function mergeMissionKitItems(items: MissionKitItem[]): MissionKitItem[] {
  const byId = new Map<string, MissionKitItem>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    byId.set(item.id, {
      ...existing,
      quantity: Math.max(existing.quantity, item.quantity),
      confidence: Math.max(existing.confidence, item.confidence),
      reference: existing.reference ?? item.reference,
      lecotSku: existing.lecotSku ?? item.lecotSku,
      source: existing.source === "historical_billing" ? existing.source : item.source,
    });
  }
  return [...byId.values()].sort((a, b) => b.confidence - a.confidence);
}

export function parseMissionKitAiResponse(raw: unknown): MissionKitAiResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as MissionKitAiResponse;
  if (!Array.isArray(data.items)) return { summary: data.summary };
  const items = data.items
    .filter((row) => row && typeof row.label === "string" && row.label.trim())
    .map((row) => ({
      label: row.label.trim(),
      reference: row.reference?.trim() || undefined,
      quantity: Math.max(1, Math.round(row.quantity ?? 1)),
      confidence: Math.min(1, Math.max(0.4, row.confidence ?? 0.72)),
    }));
  return { items, summary: data.summary };
}

export function aiItemsToMissionKitItems(items: MissionKitAiItem[]): MissionKitItem[] {
  return items.map((row) => ({
    id: slugId(row.reference ?? row.label) || "ai-item",
    label: row.label,
    reference: row.reference,
    quantity: Math.max(1, Math.round(row.quantity ?? 1)),
    source: "ai_description" as const,
    status: "unknown" as const,
    lecotSku: row.reference,
    confidence: Math.min(1, Math.max(0.4, row.confidence ?? 0.72)),
  }));
}

export function applyMissionKitAiEnrichment(
  kit: MissionKit,
  ai: MissionKitAiResponse | null
): MissionKit {
  if (!ai?.items?.length) {
    return ai?.summary ? { ...kit, summary: ai.summary } : kit;
  }
  const merged = mergeMissionKitItems([...kit.items, ...aiItemsToMissionKitItems(ai.items)]);
  return {
    ...kit,
    items: merged,
    summary: ai.summary?.trim() || kit.summary,
  };
}

export async function enrichMissionKitWithAi(
  kit: MissionKit,
  params: {
    problem?: string | null;
    address?: string | null;
    category?: string | null;
    photoUrls?: string[];
  }
): Promise<MissionKit> {
  try {
    const res = await fetchWithAuth("/api/ai/mission-kit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: params.problem ?? "",
        address: params.address ?? "",
        category: params.category ?? "",
        photoUrls: params.photoUrls ?? [],
        existingItems: kit.items.map((item) => ({
          label: item.label,
          reference: item.reference,
          quantity: item.quantity,
        })),
      }),
    });
    if (!res.ok) return kit;
    const json = (await res.json()) as unknown;
    const parsed = parseMissionKitAiResponse(json);
    return applyMissionKitAiEnrichment(kit, parsed);
  } catch {
    return kit;
  }
}

export async function buildMissionKitAsync(
  input: BuildMissionKitInput & { useAi?: boolean; address?: string | null; photoUrls?: string[] }
): Promise<MissionKit> {
  const base = buildMissionKit(input);
  if (input.useAi === false) return base;
  return enrichMissionKitWithAi(base, {
    problem: input.problem,
    address: input.address,
    category: input.category,
    photoUrls: input.photoUrls,
  });
}
