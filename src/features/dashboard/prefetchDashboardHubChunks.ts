/** Précharge les chunks hubs lourds (navigation mobile / sélecteur). */

const prefetched = new Set<string>();

function prefetchOnce(key: string, loader: () => Promise<unknown>): void {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  void loader();
}

export function prefetchTeamHubPageChunk(): void {
  prefetchOnce("teamHub", () => import("@/features/teamHub/components/TeamHubPage"));
}

export function prefetchDashboardHubChunksIdle(): void {
  const run = () => {
    prefetchTeamHubPageChunk();
    prefetchOnce("caseHub", () => import("@/features/caseHub/components/CaseHubPage"));
    prefetchOnce("planningHub", () => import("@/features/planningHub/components/PlanningHubPage"));
  };

  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(() => run(), { timeout: 4_000 });
    return;
  }
  setTimeout(run, 1_500);
}
