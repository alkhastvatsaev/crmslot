import type { Intervention } from "@/features/interventions/types";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9À-ɏ\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalize(a).split(" ").filter((t) => t.length > 2));
  const tb = new Set(normalize(b).split(" ").filter((t) => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  ta.forEach((t) => { if (tb.has(t)) shared++; });
  return shared / Math.min(ta.size, tb.size);
}

export interface DuplicateMatch {
  intervention: Intervention;
  score: number;
  reason: string;
}

/** Score 0–1. Threshold 0.6 → probable doublon. */
export function findPotentialDuplicates(
  candidate: { address: string; problem: string },
  existing: Intervention[],
  threshold = 0.6,
): DuplicateMatch[] {
  const results: DuplicateMatch[] = [];

  for (const iv of existing) {
    if (iv.status === "cancelled") continue;

    const addrScore = tokenOverlap(candidate.address, iv.address ?? "");
    const probScore = tokenOverlap(candidate.problem, (iv.problem ?? iv.title) ?? "");

    const score = addrScore * 0.6 + probScore * 0.4;
    if (score >= threshold) {
      const reasons: string[] = [];
      if (addrScore >= 0.6) reasons.push("adresse similaire");
      if (probScore >= 0.6) reasons.push("problème similaire");
      results.push({ intervention: iv, score, reason: reasons.join(" + ") });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}
