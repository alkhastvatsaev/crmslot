import type { Technician } from "@/features/technicians";
import type { Intervention } from "@/features/interventions";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { haversineDistanceKm } from "@/features/dispatch/rankTechniciansForIntervention";
import { canResolveTechnicianAssignUid } from "@/features/dispatch/technicianAssignUid";
import { technicianHasRequiredSkills } from "@/features/technicians/skillConstants";
import { computeTechnicianPerformanceScores } from "@/features/dispatch/technicianPerformanceScores";

const MAPS_TIMEOUT_MS = 6_000;

function fetchWithTimeout(
  input: Parameters<typeof fetchWithAuth>[0],
  init: Parameters<typeof fetchWithAuth>[1],
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetchWithAuth(input, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

export async function findBestTechnician(
  technicians: Technician[],
  interventionLat: number,
  interventionLng: number,
  interventionProblem?: string | null,
  interventionAddress?: string | null,
  requiredSkills?: string[] | null,
  /** Interventions historiques pour calculer les scores de performance par technicien. */
  allInterventions?: Intervention[] | null,
  urgency?: string | null
): Promise<{ technician: Technician; reasoning?: string; revenueImpact?: string | null } | null> {
  const availableTechs = technicians.filter(
    (t) =>
      t.status === "available" &&
      canResolveTechnicianAssignUid(t) &&
      typeof t.location?.lat === "number" &&
      !Number.isNaN(t.location?.lat) &&
      typeof t.location?.lng === "number" &&
      !Number.isNaN(t.location?.lng) &&
      technicianHasRequiredSkills(t.skills, requiredSkills)
  );

  if (availableTechs.length === 0) return null;

  const sortedByHaversine = [...availableTechs].sort(
    (a, b) =>
      haversineDistanceKm(interventionLat, interventionLng, a.location.lat, a.location.lng) -
      haversineDistanceKm(interventionLat, interventionLng, b.location.lat, b.location.lng)
  );

  const top3 = sortedByHaversine.slice(0, 3);

  // Compute performance scores if historical interventions are available
  const perfScores =
    allInterventions && allInterventions.length > 0
      ? computeTechnicianPerformanceScores(
          allInterventions,
          top3.map((t) => t.authUid ?? t.id).filter(Boolean)
        )
      : null;

  // Parallel distance calls with per-call timeout
  const distanceResults = await Promise.all(
    top3.map(async (tech) => {
      try {
        const response = await fetchWithTimeout(
          "/api/maps/distance",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              originLat: tech.location.lat,
              originLng: tech.location.lng,
              destLat: interventionLat,
              destLng: interventionLng,
            }),
          },
          MAPS_TIMEOUT_MS
        );
        const data = (await response.json()) as {
          success?: boolean;
          durationSeconds?: number;
          durationText?: string;
        };
        if (data.success && typeof data.durationSeconds === "number") {
          return { tech: { ...tech, realEta: data.durationText }, duration: data.durationSeconds };
        }
      } catch {
        // timeout or network error — silently skip
      }
      return null;
    })
  );

  let bestTech: Technician | null = null;
  let minDuration = Infinity;
  for (const result of distanceResults) {
    if (result && result.duration < minDuration) {
      minDuration = result.duration;
      bestTech = result.tech;
    }
  }

  const updatedTop3 = top3.map((t) => {
    const match = distanceResults.find((r) => r?.tech.id === t.id);
    const techWithEta = match ? match.tech : t;
    const uid = t.authUid ?? t.id;
    const perf = perfScores?.get(uid);
    return {
      ...techWithEta,
      ...(perf && {
        performanceScore: perf.compositeScore,
        completionRate: perf.completionRate,
        avgTicketEur: Math.round(perf.avgTicketCents / 100),
      }),
    };
  });

  try {
    const res = await fetchWithTimeout(
      "/api/ai/smart-dispatch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: interventionProblem,
          address: interventionAddress,
          technicians: updatedTop3,
          urgency: urgency ?? undefined,
        }),
      },
      MAPS_TIMEOUT_MS
    );

    if (res.ok) {
      const data = (await res.json()) as {
        bestTechnicianId?: string;
        reasoning?: string;
        revenueImpact?: string | null;
      };
      if (data.bestTechnicianId) {
        const aiChosen = updatedTop3.find((t) => t.id === data.bestTechnicianId);
        if (aiChosen) {
          return {
            technician: aiChosen,
            reasoning: data.reasoning,
            revenueImpact: data.revenueImpact ?? null,
          };
        }
      }
    }
  } catch {
    // timeout or AI error — fall through to haversine fallback
  }

  return bestTech ? { technician: bestTech } : top3[0] ? { technician: top3[0] } : null;
}
