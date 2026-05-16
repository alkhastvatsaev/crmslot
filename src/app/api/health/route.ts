import { NextResponse } from "next/server";

/** Santé légère pour monitoring / smoke deploy (sans secrets). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "belgmap",
    timestamp: new Date().toISOString(),
  });
}
