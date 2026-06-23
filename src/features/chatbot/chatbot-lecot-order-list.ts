import * as admin from "firebase-admin";

export async function listSupplierOrdersForChatbot(
  companyId: string,
  input: Record<string, unknown>
) {
  const limit = Math.min(20, Math.max(1, Number(input.limit) || 10));
  const supplierId =
    typeof input.supplierId === "string" && input.supplierId.trim()
      ? input.supplierId.trim()
      : "lecot";

  const snap = await admin
    .firestore()
    .collection("companies")
    .doc(companyId)
    .collection("supplierOrders")
    .orderBy("createdAt", "desc")
    .limit(Math.min(40, limit * 3))
    .get();

  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
    .filter((r) => String(r.supplierId || "") === supplierId)
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      status: r.status,
      supplierName: r.supplierName,
      totalEur: Math.round(Number(r.totalCents ?? 0)) / 100,
      lineCount: Array.isArray(r.lines) ? r.lines.length : 0,
      interventionId: r.interventionId ?? null,
      sentAt: r.sentAt ?? null,
    }));

  return { supplierId, orders: rows };
}
