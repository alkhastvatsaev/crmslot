import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { generateSupplierOrderPdf } from "@/features/suppliers";
import type { SupplierOrder } from "@/features/suppliers";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ companyId: string; orderId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { companyId, orderId } = await context.params;
  const cid = companyId?.trim();
  const oid = orderId?.trim();

  if (!cid || !oid || !admin.apps.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const snap = await admin
    .firestore()
    .collection("companies")
    .doc(cid)
    .collection("supplierOrders")
    .doc(oid)
    .get();

  if (!snap.exists) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const order = { id: snap.id, ...snap.data() } as SupplierOrder;
  if (String(order.companyId || cid) !== cid) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const companySnap = await admin.firestore().collection("companies").doc(cid).get();
  const companyName = String(companySnap.data()?.name ?? companySnap.data()?.label ?? "").trim();

  const pdf = generateSupplierOrderPdf(order, { companyName: companyName || undefined });

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="bon-commande-${oid.slice(0, 12)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
