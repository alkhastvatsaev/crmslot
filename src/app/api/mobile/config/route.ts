import { NextResponse } from "next/server";
import { buildMobileRuntimeConfig } from "@/features/mobile/index.server";

export const runtime = "nodejs";

/** Config publique PWA / mobile (monitoring, bootstrap client, pas d’auth). */
export async function GET() {
  const config = buildMobileRuntimeConfig();
  return NextResponse.json({
    ok: true,
    ...config,
    timestamp: new Date().toISOString(),
  });
}
