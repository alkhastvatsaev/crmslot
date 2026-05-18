import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import { toPortalSummary } from "@/features/interventions/portalToken";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || !UUID_RE.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection("interventions")
      .where("portalAccessToken", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const docSnap = snap.docs[0];
    const iv = { id: docSnap.id, ...docSnap.data() } as Intervention;

    let techName: string | null = null;
    if (iv.assignedTechnicianUid) {
      const techSnap = await db
        .collection("users")
        .doc(iv.assignedTechnicianUid)
        .get();
      if (techSnap.exists) {
        const data = techSnap.data();
        techName = (data?.displayName as string | undefined) ?? null;
      }
    }

    const summary = toPortalSummary(iv, techName);

    return NextResponse.json(summary, {
      headers: { "Cache-Control": "no-store, no-cache" },
    });
  } catch (err) {
    console.error("[portal/token] error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
