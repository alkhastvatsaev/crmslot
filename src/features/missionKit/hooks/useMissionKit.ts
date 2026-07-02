"use client";

import { useEffect, useMemo, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import type { Intervention } from "@/features/interventions";
import { buildMissionKit } from "@/features/missionKit/buildMissionKit";
import type { MissionKit } from "@/features/missionKit/types";
import {
  mapVehicleStockToMissionKit,
  mapWarehouseStockToMissionKit,
} from "@/features/missionKit/missionKitStockMappers";
import { useCompanyStockItems } from "@/features/featureHub/hooks/useCompanyStockItems";
import { subscribeStockItems } from "@/features/stock/stockFirestore";
import type { StockItem as VehicleStockItem } from "@/features/stock/types";

type Params = {
  enabled?: boolean;
  intervention: Pick<Intervention, "id" | "problem" | "title" | "category" | "companyId">;
  peerInterventions?: Intervention[];
  technicianUid?: string | null;
};

export function useMissionKit({
  enabled = true,
  intervention,
  peerInterventions = [],
  technicianUid = null,
}: Params) {
  const companyId = (intervention.companyId ?? "").trim() || null;
  const { items: warehouseItems, loading: warehouseLoading } = useCompanyStockItems(
    enabled ? companyId : null
  );
  const [vehicleItems, setVehicleItems] = useState<VehicleStockItem[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  const techUid = (technicianUid ?? "").trim();

  useEffect(() => {
    if (!enabled || !companyId || !techUid || !isConfigured || !firestore) {
      setVehicleItems([]);
      setVehicleLoading(false);
      return;
    }
    setVehicleLoading(true);
    return subscribeStockItems(firestore, companyId, techUid, (rows) => {
      setVehicleItems(rows);
      setVehicleLoading(false);
    });
  }, [enabled, companyId, techUid]);

  const kit: MissionKit = useMemo(
    () =>
      buildMissionKit({
        interventionId: intervention.id,
        problem: intervention.problem,
        title: intervention.title,
        category: intervention.category,
        peerInterventions,
        vehicleStock: mapVehicleStockToMissionKit(vehicleItems),
        warehouseStock: mapWarehouseStockToMissionKit(warehouseItems),
      }),
    [
      intervention.id,
      intervention.problem,
      intervention.title,
      intervention.category,
      peerInterventions,
      vehicleItems,
      warehouseItems,
    ]
  );

  const missingCount = kit.items.filter((item) => item.status === "missing").length;

  return {
    kit,
    loading: warehouseLoading || vehicleLoading,
    missingCount,
  };
}
