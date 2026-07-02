import type { Intervention } from "@/features/interventions";
import {
  jaccardTokenSimilarity,
  problemTextForDedupe,
} from "@/features/interventions/duplicateDetectionCore";
import type { MissionKitItem } from "@/features/missionKit/types";

const COMPLETED_STATUSES = new Set<Intervention["status"]>(["done", "invoiced"]);
const MAX_SIMILAR_JOBS = 3;
const MIN_SIMILARITY = 0.25;

export type HistoricalPatternItem = {
  label: string;
  reference?: string;
  quantity: number;
  similarity: number;
  sourceInterventionId: string;
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

function isBillableLine(description: string): boolean {
  const d = description.trim().toLowerCase();
  if (!d) return false;
  return !/main[\s-]?d['']?œuvre|deplacement|déplacement|forfait|mo\b/i.test(d);
}

export function rankSimilarCompletedInterventions(
  target: Pick<Intervention, "id" | "problem" | "title">,
  peers: Intervention[]
): Array<{ intervention: Intervention; similarity: number }> {
  const probe = problemTextForDedupe(target);
  if (!probe) return [];

  const ranked: Array<{ intervention: Intervention; similarity: number }> = [];
  for (const iv of peers) {
    if (iv.id === target.id) continue;
    if (!COMPLETED_STATUSES.has(iv.status)) continue;
    const peerText = problemTextForDedupe(iv);
    if (!peerText) continue;
    const similarity = jaccardTokenSimilarity(probe, peerText);
    if (similarity < MIN_SIMILARITY) continue;
    ranked.push({ intervention: iv, similarity });
  }

  return ranked.sort((a, b) => b.similarity - a.similarity).slice(0, MAX_SIMILAR_JOBS);
}

export function extractHistoricalPatternItems(
  ranked: Array<{ intervention: Intervention; similarity: number }>
): HistoricalPatternItem[] {
  const byKey = new Map<string, HistoricalPatternItem>();

  for (const { intervention, similarity } of ranked) {
    for (const line of intervention.billingLines ?? []) {
      const label = line.description?.trim() ?? "";
      if (!isBillableLine(label)) continue;
      const reference = line.reference?.trim() || undefined;
      const key = `${reference ?? ""}::${label.toLowerCase()}`;
      const quantity = Math.max(1, Math.round(line.quantity ?? 1));
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, {
          label,
          reference,
          quantity,
          similarity,
          sourceInterventionId: intervention.id,
        });
        continue;
      }
      byKey.set(key, {
        ...existing,
        quantity: Math.max(existing.quantity, quantity),
        similarity: Math.max(existing.similarity, similarity),
      });
    }
  }

  return [...byKey.values()].sort((a, b) => b.similarity - a.similarity);
}

export function historicalPatternsToMissionKitItems(
  patterns: HistoricalPatternItem[]
): MissionKitItem[] {
  return patterns.map((pattern) => ({
    id: slugId(pattern.reference ?? pattern.label) || `hist-${pattern.sourceInterventionId}`,
    label: pattern.label,
    reference: pattern.reference,
    quantity: pattern.quantity,
    source: "historical_billing" as const,
    status: "unknown" as const,
    lecotSku: pattern.reference,
    confidence: Math.min(0.95, 0.55 + pattern.similarity * 0.35),
  }));
}

export function buildHistoricalHint(patterns: HistoricalPatternItem[]): string | undefined {
  if (patterns.length === 0) return undefined;
  const top = patterns.slice(0, 3).map((p) => p.label);
  return `Pièces facturées sur jobs similaires : ${top.join(", ")}`;
}
