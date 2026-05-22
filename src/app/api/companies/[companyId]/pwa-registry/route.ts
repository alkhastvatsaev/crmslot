import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { isFirebaseAdminReady } from "@/core/config/firebase-admin";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { readStoredOrderClientName } from "@/features/materials/materialOrderClientName";
import type { SupplierOrder } from "@/features/suppliers/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ companyId: string }> };

function serializeTimestamp(raw: unknown): string {
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return new Date((raw as { seconds: number }).seconds * 1000).toISOString();
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const t = Date.parse(String(raw));
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return new Date().toISOString();
}

/** Liste commandes fournisseur + bons matériel (Admin SDK — fiable si règles client bloquent). */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { companyId } = await context.params;
  const cid = companyId?.trim();
  if (!cid) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      {
        error:
          "Firebase Admin absent : ajoutez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY dans .env.local (voir .env.example), puis redémarrez npm run dev.",
        adminReady: false,
      },
      { status: 503 },
    );
  }

  const db = admin.firestore();

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

  const supplierOrders: SupplierOrder[] = (supplierSnap?.docs ?? [])
    .map((d) => {
    const data = d.data();
    return {
      id: d.id,
      companyId: String(data.companyId ?? cid),
      supplierId: String(data.supplierId ?? "lecot"),
      supplierName: String(data.supplierName ?? "Lecot"),
      status: data.status ?? "draft",
      lines: Array.isArray(data.lines) ? data.lines : [],
      totalCents: Number(data.totalCents) || 0,
      deliveryDate: data.deliveryDate ?? null,
      notes: data.notes ?? null,
      createdAt: serializeTimestamp(data.createdAt),
      updatedAt: serializeTimestamp(data.updatedAt),
      sentAt: data.sentAt ?? null,
      deliveredAt: data.deliveredAt ?? null,
      createdByUid: data.createdByUid ?? null,
      isDemo: Boolean(data.isDemo),
      interventionId: data.interventionId ?? undefined,
      clientName: readStoredOrderClientName(data as Record<string, unknown>) ?? undefined,
    } as SupplierOrder;
  })
    .sort(
      (a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)),
    );

  const materialOrders: MaterialOrderDoc[] = (materialSnap?.docs ?? [])
    .map((d) => {
      const data = d.data();
      const clientName = readStoredOrderClientName(data as Record<string, unknown>);
      return {
        id: d.id,
        ...(data as Omit<MaterialOrderDoc, "id">),
        ...(clientName ? { clientName } : {}),
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
      };
    })
    .sort(
      (a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)),
    )
    .slice(0, 30);

  return NextResponse.json({ supplierOrders, materialOrders });
}
