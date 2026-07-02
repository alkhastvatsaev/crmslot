import type { MissionKitItem, MissionKitItemStatus } from "@/features/missionKit/types";

export type MissionKitStockSnapshot = {
  reference?: string | null;
  description: string;
  lecotSku?: string | null;
  quantity: number;
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stockKeys(line: MissionKitStockSnapshot): string[] {
  const keys: string[] = [];
  const ref = (line.reference ?? "").trim();
  const sku = (line.lecotSku ?? "").trim();
  const desc = normalizeKey(line.description ?? "");
  if (ref) keys.push(normalizeKey(ref));
  if (sku) keys.push(normalizeKey(sku));
  if (desc) keys.push(desc);
  return keys;
}

function itemKeys(item: MissionKitItem): string[] {
  const keys: string[] = [];
  const ref = (item.reference ?? "").trim();
  const sku = (item.lecotSku ?? "").trim();
  const label = normalizeKey(item.label);
  if (ref) keys.push(normalizeKey(ref));
  if (sku) keys.push(normalizeKey(sku));
  if (label) keys.push(label);
  return keys;
}

function findStockMatch(
  item: MissionKitItem,
  stock: MissionKitStockSnapshot[]
): MissionKitStockSnapshot | null {
  const keys = itemKeys(item);
  if (keys.length === 0) return null;

  for (const line of stock) {
    const lineKeys = stockKeys(line);
    if (lineKeys.length === 0) continue;
    const hit = keys.some((k) =>
      lineKeys.some((lk) => lk === k || lk.includes(k) || k.includes(lk))
    );
    if (hit) return line;
  }
  return null;
}

function resolveStatus(
  item: MissionKitItem,
  vehicleStock: MissionKitStockSnapshot[],
  warehouseStock: MissionKitStockSnapshot[]
): MissionKitItemStatus {
  const vehicle = findStockMatch(item, vehicleStock);
  if (vehicle && vehicle.quantity >= item.quantity) return "in_vehicle";

  const warehouse = findStockMatch(item, warehouseStock);
  if (warehouse && warehouse.quantity >= item.quantity) return "in_warehouse";

  if (vehicle || warehouse) return "missing";
  return item.status;
}

export function computeMissionKitCompletenessScore(items: MissionKitItem[]): number {
  if (items.length === 0) return 0;
  const inVehicle = items.filter((i) => i.status === "in_vehicle").length;
  return Math.round((inVehicle / items.length) * 100);
}

export function matchMissionKitToStock(
  items: MissionKitItem[],
  params: {
    vehicleStock?: MissionKitStockSnapshot[];
    warehouseStock?: MissionKitStockSnapshot[];
  }
): { items: MissionKitItem[]; completenessScore: number } {
  const vehicleStock = params.vehicleStock ?? [];
  const warehouseStock = params.warehouseStock ?? [];
  const hasStock = vehicleStock.length > 0 || warehouseStock.length > 0;

  if (!hasStock) {
    return { items, completenessScore: 0 };
  }

  const matched = items.map((item) => ({
    ...item,
    status: resolveStatus(item, vehicleStock, warehouseStock),
  }));

  const completenessScore =
    vehicleStock.length > 0 ? computeMissionKitCompletenessScore(matched) : 0;

  return { items: matched, completenessScore };
}
