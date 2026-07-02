import type { MaterialOrderPart } from "@/features/materials/types";
import type { MissionKitItem } from "@/features/missionKit/types";

export function missionKitItemToMaterialOrderPart(item: MissionKitItem): MaterialOrderPart {
  return {
    description: item.label.trim(),
    quantity: Math.max(1, item.quantity),
    reference: (item.reference ?? item.lecotSku)?.trim() || undefined,
  };
}

export function canOrderMissionKitItem(
  item: MissionKitItem,
  orderedItemIds: string[] = []
): boolean {
  if (orderedItemIds.includes(item.id)) return false;
  return item.status === "missing" || item.status === "in_warehouse";
}
