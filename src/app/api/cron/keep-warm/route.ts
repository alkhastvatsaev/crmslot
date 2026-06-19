import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { requireCronSecret } from "@/core/api/routeAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = requireCronSecret(request);
  if (guard) return guard;

  return NextResponse.json({
    ok: true,
    warm: true,
    firebaseAdmin: isFirebaseAdminReady(),
    at: new Date().toISOString(),
  });
}
