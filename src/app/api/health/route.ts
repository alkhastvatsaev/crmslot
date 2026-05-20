import { NextResponse } from "next/server";
import { isFirebaseAdminReady } from "@/core/config/firebase-admin";
import "@/core/config/firebase-admin";

/** Santé légère pour monitoring / smoke deploy (sans secrets). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "belgmap",
    firebaseAdmin: isFirebaseAdminReady(),
    timestamp: new Date().toISOString(),
  });
}
