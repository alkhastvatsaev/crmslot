import type { Intervention } from "@/features/interventions/types";
import {
  clientIdentitiesConflict,
  clientIdentityMatchHints,
  extractClientIdentityFromIntervention,
  jaccardTokenSimilarity,
  normalizeAddressForDedupe,
  type DuplicateClientIdentity,
} from "@/features/interventions/duplicateDetectionCore";

export type DuplicateCandidate = {
  address: string;
  problem: string;
  client?: DuplicateClientIdentity;
};

export interface DuplicateMatch {
  intervention: Intervention;
  score: number;
  reason: string;
}

function tokenOverlap(a: string, b: string): number {
  const ta = normalizeAddressForDedupe(a)
    .split(" ")
    .filter((w) => w.length > 2);
  const tb = normalizeAddressForDedupe(b)
    .split(" ")
    .filter((w) => w.length > 2);
  if (ta.length === 0 || tb.length === 0) return 0;
  return jaccardTokenSimilarity(a, b);
}

/** Score 0–1. Threshold 0.6 → probable doublon. Ignore si client clairement différent. */
export function findPotentialDuplicates(
  candidate: DuplicateCandidate,
  existing: Intervention[],
  threshold = 0.6
): DuplicateMatch[] {
  const results: DuplicateMatch[] = [];
  const candidateClient = candidate.client ?? {};

  for (const iv of existing) {
    if (iv.status === "cancelled") continue;

    const existingClient = extractClientIdentityFromIntervention(iv);
    if (clientIdentitiesConflict(candidateClient, existingClient)) continue;

    const addrScore = tokenOverlap(candidate.address, iv.address ?? "");
    const probScore = tokenOverlap(candidate.problem, iv.problem ?? iv.title ?? "");

    const score = addrScore * 0.6 + probScore * 0.4;
    if (score >= threshold) {
      const reasons: string[] = [];
      if (addrScore >= 0.6) reasons.push("adresse similaire");
      if (probScore >= 0.6) reasons.push("problème similaire");
      reasons.push(...clientIdentityMatchHints(candidateClient, existingClient));
      results.push({
        intervention: iv,
        score,
        reason: reasons.join(" + ") || "demande similaire",
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}
