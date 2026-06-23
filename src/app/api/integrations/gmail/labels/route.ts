import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { createGmailApiClient } from "@/core/services/email/gmailApiClient";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { mapGmailLabel } from "@/features/gmail";

export const runtime = "nodejs";

/** Liste des libellés Gmail du compte connecté. */
export async function GET(req: NextRequest) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  try {
    const gmail = await createGmailApiClient();
    const res = await gmail.users.labels.list({ userId: "me" });
    const labels = (res.data.labels ?? []).map(mapGmailLabel).filter((l) => l.id);
    return NextResponse.json({ labels });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Liste des libellés impossible.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
