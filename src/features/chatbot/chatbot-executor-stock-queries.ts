import { db } from "@/features/chatbot/chatbot-executor-db";

export async function fetchStockDocs(companyId: string): Promise<Record<string, unknown>[]> {
  const firestore = db();
  let snap = await firestore
    .collection("stockItems")
    .where("companyId", "==", companyId)
    .limit(80)
    .get();
  if (snap.empty) {
    snap = await firestore
      .collection("stock_items")
      .where("companyId", "==", companyId)
      .limit(80)
      .get();
  }
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
}

export async function listStockAlerts(companyId: string) {
  const items = await fetchStockDocs(companyId);
  return items
    .filter(
      (s) =>
        typeof s["quantity"] === "number" &&
        typeof s["alertThreshold"] === "number" &&
        (s["quantity"] as number) <= (s["alertThreshold"] as number)
    )
    .map((s) => ({
      id: s["id"],
      name: s["name"],
      quantity: s["quantity"],
      alertThreshold: s["alertThreshold"],
      unit: s["unit"] ?? null,
    }));
}

function vehicleStockCol(companyId: string, techUid: string) {
  return db()
    .collection("companies")
    .doc(companyId)
    .collection("technicianStocks")
    .doc(techUid)
    .collection("items");
}

export async function listVehicleStock(companyId: string, techUid: string) {
  const snap = await vehicleStockCol(companyId, techUid).orderBy("label").get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      sku: data.sku ?? "",
      label: data.label ?? "",
      quantity: data.quantity ?? 0,
      minQuantity: data.minQuantity ?? 0,
      unitPriceCents: data.unitPriceCents ?? 0,
      low:
        typeof data.quantity === "number" && typeof data.minQuantity === "number"
          ? data.quantity <= data.minQuantity
          : false,
    };
  });
}

export async function addVehicleStockItem(
  companyId: string,
  techUid: string,
  data: {
    sku: string;
    label: string;
    quantity: number;
    minQuantity: number;
    unitPriceCents: number;
  }
) {
  const ref = await vehicleStockCol(companyId, techUid).add({
    ...data,
    companyId,
    technicianUid: techUid,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true, id: ref.id, label: data.label };
}

export async function updateVehicleStockItem(
  companyId: string,
  techUid: string,
  itemId: string,
  patch: {
    quantityDelta?: number;
    quantity?: number;
    label?: string;
    minQuantity?: number;
    unitPriceCents?: number;
  }
) {
  const docRef = vehicleStockCol(companyId, techUid).doc(itemId);
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (patch.quantityDelta !== undefined) {
    const snap = await docRef.get();
    if (!snap.exists) throw new Error(`Article ${itemId} introuvable`);
    const current = (snap.data()!["quantity"] as number) ?? 0;
    updates.quantity = Math.max(0, current + patch.quantityDelta);
  } else if (patch.quantity !== undefined) {
    updates.quantity = Math.max(0, patch.quantity);
  }
  if (patch.label !== undefined) updates.label = patch.label;
  if (patch.minQuantity !== undefined) updates.minQuantity = patch.minQuantity;
  if (patch.unitPriceCents !== undefined) updates.unitPriceCents = patch.unitPriceCents;

  await docRef.update(updates);
  return { ok: true, id: itemId, newQuantity: updates.quantity ?? null };
}
