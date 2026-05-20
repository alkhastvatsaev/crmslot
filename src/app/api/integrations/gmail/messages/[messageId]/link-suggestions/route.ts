import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUserOrLocalDev } from "@/core/api/routeAuth";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { suggestGmailInterventionLinksForChatbot } from "@/features/chatbot/chatbot-gmail";
import { verifyGmailRouteCompanyAccess } from "@/features/gmail/gmailRouteCompany";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ messageId: string }> };

/** Suggestions de dossiers à lier à un mail Gmail (même scoring que le chatbot). */
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  if (!(await isGmailOAuthConfigured())) {
    return NextResponse.json({ error: "Gmail OAuth non configuré." }, { status: 503 });
  }

  const { messageId } = await context.params;
  const id = messageId?.trim();
  if (!id) {
    return NextResponse.json({ error: "messageId requis." }, { status: 400 });
  }

  const companyId = req.nextUrl.searchParams.get("companyId")?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ error: "companyId requis." }, { status: 400 });
  }

  if (!(await verifyGmailRouteCompanyAccess(auth.uid, companyId))) {
    return NextResponse.json({ error: "Accès société refusé." }, { status: 403 });
  }

  try {
    const result = await suggestGmailInterventionLinksForChatbot(companyId, { messageId: id });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Suggestions indisponibles.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
