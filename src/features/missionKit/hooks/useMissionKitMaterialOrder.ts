"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { auth, firestore } from "@/core/config/firebase";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions";
import { technicianTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { createMaterialOrder } from "@/features/materials/createMaterialOrder";
import {
  canOrderMissionKitItem,
  missionKitItemToMaterialOrderPart,
} from "@/features/missionKit/missionKitItemToMaterialOrderPart";
import type { MissionKitItem } from "@/features/missionKit/types";

type Params = {
  enabled?: boolean;
  intervention: Pick<
    Intervention,
    | "id"
    | "status"
    | "companyId"
    | "assignedTechnicianUid"
    | "createdByUid"
    | "title"
    | "clientFirstName"
    | "clientLastName"
    | "clientName"
    | "clientCompanyName"
  >;
  technicianUid: string;
};

export function useMissionKitMaterialOrder({
  enabled = true,
  intervention,
  technicianUid,
}: Params) {
  const { t } = useTranslation();
  const [orderingItemId, setOrderingItemId] = useState<string | null>(null);
  const [orderedItemIds, setOrderedItemIds] = useState<string[]>([]);

  const orderItem = useCallback(
    async (item: MissionKitItem) => {
      if (!enabled || !firestore) return;
      if (!canOrderMissionKitItem(item, orderedItemIds)) return;

      const uid = auth?.currentUser?.uid?.trim() || technicianUid.trim();
      if (!uid) {
        toast.error(String(t("technician_hub.mission_kit.order_error")));
        return;
      }

      setOrderingItemId(item.id);
      try {
        await createMaterialOrder({
          db: firestore,
          intervention,
          technicianUid: uid,
          partsRequested: [missionKitItemToMaterialOrderPart(item)],
          urgency: "normal",
          actor: technicianTransitionActor(uid),
          setWaitingMaterial: true,
        });
        setOrderedItemIds((prev) => [...prev, item.id]);
        toast.success(String(t("technician_hub.mission_kit.order_success")));
      } catch {
        toast.error(String(t("technician_hub.mission_kit.order_error")));
      } finally {
        setOrderingItemId(null);
      }
    },
    [enabled, intervention, orderedItemIds, t, technicianUid]
  );

  return {
    orderItem,
    orderingItemId,
    orderedItemIds,
    canOrderItem: (item: MissionKitItem) => canOrderMissionKitItem(item, orderedItemIds),
  };
}
