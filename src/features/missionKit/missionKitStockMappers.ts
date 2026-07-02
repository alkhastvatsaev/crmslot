import type { StockItem as WarehouseStockItem } from "@/features/materials/stockFirestore";
import type { StockItem as VehicleStockItem } from "@/features/stock/types";
import type { MissionKitStockSnapshot } from "@/features/missionKit/matchMissionKitToStock";

export function mapWarehouseStockToMissionKit(
  items: WarehouseStockItem[]
): MissionKitStockSnapshot[] {
  return items.map((item) => ({
    reference: item.reference,
    description: item.description,
    lecotSku: item.lecotSku,
    quantity: item.quantity,
  }));
}

export function mapVehicleStockToMissionKit(items: VehicleStockItem[]): MissionKitStockSnapshot[] {
  return items.map((item) => ({
    reference: item.sku,
    description: item.label,
    lecotSku: item.sku,
    quantity: item.quantity,
  }));
}
