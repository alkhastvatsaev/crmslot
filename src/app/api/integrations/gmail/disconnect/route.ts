import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { revokeStoredGmailOAuth } from "@/core/services/email/gmailOAuthConfig";
import { setGmailHubDisconnectedCookie } from "@/core/services/email/gmailHubSession";

export const runtime = "nodejs";

/** Déconnexion Gmail (cookie session + jeton Firestore). */
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  await revokeStoredGmailOAuth();
  const res = NextResponse.json({ ok: true });
  setGmailHubDisconnectedCookie(res, true);
  return res;
}
