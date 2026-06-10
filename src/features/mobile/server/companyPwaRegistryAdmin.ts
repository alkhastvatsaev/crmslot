import type { Firestore } from "firebase-admin/firestore";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { readStoredOrderClientName } from "@/features/materials/materialOrderClientName";
import type { SupplierOrder } from "@/features/suppliers/types";

export type PwaRegistryPayload = {
  supplierOrders: SupplierOrder[];
  materialOrders: MaterialOrderDoc[];
};

export type FirestoreDocSnap = {
  id: string;
  data: () => Record<string, unknown>;
};

/** Normalise timestamps Firestore Admin / ISO / epoch. */
export function serializePwaRegistryTimestamp(raw: unknown, fallbackMs = Date.now()): string {
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    const seconds = Number((raw as { seconds: number }).seconds);
    if (Number.isFinite(seconds)) {
      return new Date(seconds * 1000).toISOString();
    }
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const t = Date.parse(String(raw));
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return new Date(fallbackMs).toISOString();
}

export function mapSupplierOrderDoc(
  doc: FirestoreDocSnap,
  companyId: string,
  fallbackMs = Date.now()
): SupplierOrder {
  const data = doc.data();
  return {
    id: doc.id,
    companyId: String(data.companyId ?? companyId),
    supplierId: String(data.supplierId ?? "lecot"),
    supplierName: String(data.supplierName ?? "Lecot"),
    status: (data.status as SupplierOrder["status"]) ?? "draft",
    lines: Array.isArray(data.lines) ? (data.lines as SupplierOrder["lines"]) : [],
    totalCents: Number(data.totalCents) || 0,
    deliveryDate: (data.deliveryDate as string | null) ?? null,
    notes: (data.notes as string | null) ?? null,
    createdAt: serializePwaRegistryTimestamp(data.createdAt, fallbackMs),
    updatedAt: serializePwaRegistryTimestamp(data.updatedAt, fallbackMs),
    sentAt: (data.sentAt as string | null) ?? null,
    deliveredAt: (data.deliveredAt as string | null) ?? null,
    createdByUid: (data.createdByUid as string | null) ?? null,
    isDemo: Boolean(data.isDemo),
    interventionId: data.interventionId as string | undefined,
    clientName: readStoredOrderClientName(data) ?? undefined,
  };
}

export function mapMaterialOrderDoc(
  doc: FirestoreDocSnap,
  fallbackMs = Date.now()
): MaterialOrderDoc {
  const data = doc.data();
  const clientName = readStoredOrderClientName(data);
  return {
    id: doc.id,
    ...(data as Omit<MaterialOrderDoc, "id">),
    ...(clientName ? { clientName } : {}),
    createdAt: serializePwaRegistryTimestamp(data.createdAt, fallbackMs),
    updatedAt: serializePwaRegistryTimestamp(data.updatedAt, fallbackMs),
  };
}

export function buildCompanyPwaRegistry(
  companyId: string,
  supplierDocs: FirestoreDocSnap[],
  materialDocs: FirestoreDocSnap[],
  options?: { fallbackMs?: number; materialLimit?: number }
): PwaRegistryPayload {
  const fallbackMs = options?.fallbackMs ?? Date.now();
  const materialLimit = options?.materialLimit ?? 30;

  const supplierOrders = supplierDocs
    .map((d) => mapSupplierOrderDoc(d, companyId, fallbackMs))
    .sort((a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)));

  const materialOrders = materialDocs
    .map((d) => mapMaterialOrderDoc(d, fallbackMs))
    .sort((a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)))
    .slice(0, materialLimit);

  return { supplierOrders, materialOrders };
}

export type PwaRegistryFirestore = {
  loadCompanyPwaRegistry(companyId: string): Promise<PwaRegistryPayload>;
};

/** Charge registre PWA société via Admin SDK (injectable pour tests). */
export async function loadCompanyPwaRegistryAdmin(
  db: Firestore,
  companyId: string
): Promise<PwaRegistryPayload> {
  const cid = companyId.trim();
  const [supplierSnap, materialSnap] = await Promise.all([
    db
      .collection("companies")
      .doc(cid)
      .collection("supplierOrders")
      .limit(40)
      .get()
      .catch(() => null),
    db
      .collection("material_orders")
      .where("companyId", "==", cid)
      .limit(50)
      .get()
      .catch(() => null),
  ]);

  const supplierDocs = (supplierSnap?.docs ?? []).map((d) => ({
    id: d.id,
    data: () => d.data() as Record<string, unknown>,
  }));
  const materialDocs = (materialSnap?.docs ?? []).map((d) => ({
    id: d.id,
    data: () => d.data() as Record<string, unknown>,
  }));

  return buildCompanyPwaRegistry(cid, supplierDocs, materialDocs);
}
