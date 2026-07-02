export type MissionKitItemSource =
  | "ai_description"
  | "historical_billing"
  | "lecot_catalog"
  | "heuristic"
  | "manual";

export type MissionKitItemStatus = "in_vehicle" | "in_warehouse" | "missing" | "unknown";

export type MissionKitItem = {
  id: string;
  label: string;
  reference?: string;
  quantity: number;
  source: MissionKitItemSource;
  status: MissionKitItemStatus;
  lecotSku?: string;
  confidence: number;
};

export type MissionKit = {
  interventionId: string;
  generatedAt: string;
  items: MissionKitItem[];
  summary?: string;
  historicalHint?: string;
  completenessScore: number;
};

export type MissionKitChecklist = {
  interventionId: string;
  checkedItemIds: string[];
  checkedAt?: string;
  checkedByUid?: string;
};

export type BuildMissionKitInput = {
  interventionId: string;
  problem?: string | null;
  title?: string | null;
  category?: "serrurerie" | "autre" | null;
  generatedAt?: string;
  /** Interventions passées de la société — enrichissement historique (phase K2). */
  peerInterventions?: import("@/features/interventions").Intervention[];
  vehicleStock?: import("@/features/missionKit/matchMissionKitToStock").MissionKitStockSnapshot[];
  warehouseStock?: import("@/features/missionKit/matchMissionKitToStock").MissionKitStockSnapshot[];
  catalog?: import("@/features/catalog/productQuickAdd").CatalogProduct[];
};
