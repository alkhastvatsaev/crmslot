import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { generateInterventionDocumentPdf } from "@/features/billing/generateQuotePdf";
import { generateMaterialOrdersPdf } from "@/features/materials/generateMaterialOrderPdf";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { loadBillingPdfBrandingForIntervention } from "@/features/billing/loadBillingPdfBrandingForIntervention";
import {
  CHATBOT_DOCUMENT_LABELS,
  isChatbotDocumentKind,
} from "@/features/chatbot/chatbot-document";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const interventionId = id?.trim();
  const url = new URL(request.url);
  const typeRaw = url.searchParams.get("type") ?? "quote";

  if (!interventionId || !admin.apps.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isChatbotDocumentKind(typeRaw)) {
    return NextResponse.json({ error: "type invalide (quote|invoice|report)" }, { status: 400 });
  }

  const snap = await admin.firestore().doc(`interventions/${interventionId}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = snap.data()!;
  const iv = { id: snap.id, ...data } as Intervention;
  const companyId = String(data.companyId || "").trim();
  let pdf: Uint8Array;
  if (typeRaw === "material_order") {
    const ordersSnap = await admin
      .firestore()
      .collection("material_orders")
      .where("interventionId", "==", interventionId)
      .limit(30)
      .get();
    const orders = ordersSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as MaterialOrderDoc,
    );
    pdf = generateMaterialOrdersPdf(
      interventionId,
      orders,
      String(iv.clientName ?? "").trim() || undefined,
    );
  } else {
    const branding =
      typeRaw !== "report" && companyId
        ? await loadBillingPdfBrandingForIntervention(admin.firestore(), companyId)
        : undefined;
    pdf = generateInterventionDocumentPdf(iv, typeRaw, branding);
  }
  const label = CHATBOT_DOCUMENT_LABELS[typeRaw].toLowerCase().replace(/\s+/g, "-");

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${label}-${interventionId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
