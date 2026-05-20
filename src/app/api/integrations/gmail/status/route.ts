import { NextRequest, NextResponse } from "next/server";
import {
  isLocalDevelopmentRuntime,
  requireAuthenticatedUserOrLocalDev,
} from "@/core/api/routeAuth";
import {
  isGmailOAuthClientConfigured,
  isGmailOAuthConfigured,
  resolveGmailOAuthConfig,
} from "@/core/services/email/gmailOAuthConfig";
import { isGmailHubUserDisconnected } from "@/core/services/email/gmailHubSession";

export const runtime = "nodejs";

/** État de connexion Gmail (compte serveur GMAIL_USER). */
export async function GET(req: NextRequest) {
  const auth = await requireAuthenticatedUserOrLocalDev(req);
  if ("response" in auth) return auth.response;

  const { senderEmail } = await resolveGmailOAuthConfig();
  const smtpConfigured = Boolean(
    process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim(),
  );

  const userDisconnected = isGmailHubUserDisconnected(req);
  const envConfigured = await isGmailOAuthConfigured();

  return NextResponse.json({
    oauthConfigured: envConfigured && !userDisconnected,
    oauthClientConfigured: isGmailOAuthClientConfigured(),
    smtpConfigured,
    email: senderEmail || null,
    devLocalMode: isLocalDevelopmentRuntime(),
    userDisconnected,
  });
}
