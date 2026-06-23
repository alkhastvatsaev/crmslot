import { NextResponse } from "next/server";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { verifyPortalAccessAdmin } from "@/features/interventions/index.server";
import { portalAccessDeniedResponse, rateLimitByIp } from "@/core/api/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimitByIp(request, "portal-access-verify", 20, 15 * 60 * 1000);
  if (limited) return limited;

  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as { email?: string; code?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const code = body.code?.trim() ?? "";
  const email = body.email?.trim();
  if (!code) {
    return NextResponse.json({ error: "Numéro de dossier requis" }, { status: 400 });
  }

  try {
    const result = await verifyPortalAccessAdmin({ db: getAdminDb(), code, email });
    return NextResponse.json(result);
  } catch (error) {
    return portalAccessDeniedResponse();
  }
}
