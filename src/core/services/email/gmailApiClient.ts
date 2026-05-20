import { google, type gmail_v1 } from "googleapis";
import { resolveGmailOAuthConfig } from "@/core/services/email/gmailOAuthConfig";

export async function createGmailApiClient(): Promise<gmail_v1.Gmail> {
  const { clientId, clientSecret, redirectUri, refreshToken } = await resolveGmailOAuthConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "OAuth Gmail incomplet — connectez Gmail depuis la page 7 ou configurez GOOGLE_CLIENT_* et GMAIL_REFRESH_TOKEN.",
    );
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth: oauth2 });
}
