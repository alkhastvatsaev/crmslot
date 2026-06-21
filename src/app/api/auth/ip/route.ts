import { NextResponse } from "next/server";
import { clientIp, requireAuthenticatedUser } from "@/core/api/routeAuth";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  // En mode local, cela peut renvoyer ::1 ou 127.0.0.1
  const ip = clientIp(request) || "127.0.0.1";

  return NextResponse.json({ success: true, ip });
}
