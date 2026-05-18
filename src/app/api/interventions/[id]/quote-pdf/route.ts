import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { generateInterventionQuotePdf } from "@/features/billing/generateQuotePdf";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const interventionId = id?.trim();
  if (!interventionId || !admin.apps.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const snap = await admin.firestore().doc(`interventions/${interventionId}`).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  const pdf = generateInterventionQuotePdf(iv);

  return new NextResponse(Buffer.from(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="devis-${interventionId}.pdf"`,
    },
  });
}
