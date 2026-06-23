import { db, parseIsoMs } from "@/features/chatbot/chatbot-executor-db";

export async function listMaterialOrders(interventionId: string, input: Record<string, unknown>) {
  if (!interventionId.trim()) throw new Error("interventionId requis");
  const limit = Math.min(20, Math.max(1, Number(input.limit) || 10));
  const snap = await db()
    .collection("material_orders")
    .where("interventionId", "==", interventionId)
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
}

export async function listCompanyMaterialOrders(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const statusFilter =
    typeof input.status === "string" && input.status.trim() ? input.status.trim() : null;
  const snap = await db()
    .collection("material_orders")
    .where("companyId", "==", companyId)
    .limit(80)
    .get();
  let rows = snap.docs.map((d) => {
    const data = d.data();
    const parts = Array.isArray(data.partsRequested) ? data.partsRequested : [];
    const first = parts[0] as { description?: string } | undefined;
    return {
      id: d.id,
      interventionId: data.interventionId ?? null,
      status: data.status ?? null,
      urgency: data.urgency ?? null,
      summary: first?.description?.trim() || "Bon matériel",
      createdAt: data.createdAt ?? null,
    };
  });
  if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
  rows.sort((a, b) => parseIsoMs(b.createdAt) - parseIsoMs(a.createdAt));
  return { count: rows.length, orders: rows.slice(0, limit) };
}

export async function listSupplierOrders(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(30, Math.max(1, Number(input.limit) || 15));
  let query = db()
    .collection("companies")
    .doc(companyId)
    .collection("supplierOrders")
    .orderBy("createdAt", "desc")
    .limit(limit);
  if (typeof input.supplierId === "string" && input.supplierId.trim()) {
    query = query.where("supplierId", "==", input.supplierId.trim()) as typeof query;
  }
  if (typeof input.status === "string" && input.status.trim()) {
    query = query.where("status", "==", input.status.trim()) as typeof query;
  }
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>);
}
