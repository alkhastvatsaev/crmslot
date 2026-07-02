import { unknownTimestampToMs } from "@/features/backoffice/timeHelpers";
import type { Intervention } from "@/features/interventions";
import type { StockItem } from "@/features/materials/stockFirestore";
import { buildMissionKit } from "@/features/missionKit/buildMissionKit";
import { mapWarehouseStockToMissionKit } from "@/features/missionKit/missionKitStockMappers";

export type MissionKitHubMetrics = {
  evaluated30d: number;
  complete30d: number;
  completePct30d: number;
  waitingMaterialJobs: number;
};

const HORIZON_MS = 30 * 24 * 60 * 60 * 1000;

function isEvaluableIntervention(iv: Intervention): boolean {
  const status = iv.status ?? "pending";
  if (status === "cancelled") return false;
  return true;
}

export function filterInterventionsLast30d(
  interventions: Intervention[],
  now: Date = new Date()
): Intervention[] {
  const cutoff = now.getTime() - HORIZON_MS;
  return interventions.filter((iv) => {
    if (!isEvaluableIntervention(iv)) return false;
    const ms = unknownTimestampToMs(iv.createdAt as unknown);
    return ms != null && ms >= cutoff;
  });
}

export function computeMissionKitHubMetrics(
  interventions: Intervention[],
  warehouseItems: StockItem[],
  now: Date = new Date()
): MissionKitHubMetrics {
  const recent = filterInterventionsLast30d(interventions, now);
  const warehouseStock = mapWarehouseStockToMissionKit(warehouseItems);
  const waitingMaterialJobs = interventions.filter((iv) => iv.status === "waiting_material").length;

  let complete30d = 0;
  for (const iv of recent) {
    const kit = buildMissionKit({
      interventionId: iv.id,
      problem: iv.problem,
      title: iv.title,
      category: iv.category,
      peerInterventions: recent,
      warehouseStock,
    });
    if (kit.completenessScore >= 100 && kit.items.length > 0) {
      complete30d += 1;
    }
  }

  const evaluated30d = recent.length;
  const completePct30d = evaluated30d > 0 ? Math.round((complete30d / evaluated30d) * 100) : 100;

  return {
    evaluated30d,
    complete30d,
    completePct30d,
    waitingMaterialJobs,
  };
}
