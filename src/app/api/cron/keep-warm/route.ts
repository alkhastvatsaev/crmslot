import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { isFirebaseAdminReady } from "@/core/config/firebase-admin";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    warm: true,
    firebaseAdmin: isFirebaseAdminReady(),
    at: new Date().toISOString(),
  });
}
