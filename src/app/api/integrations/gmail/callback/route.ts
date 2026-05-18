import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGmailOAuthConfig } from "@/core/services/email/gmailOAuthConfig";

/** Callback OAuth — affiche le refresh token à copier dans GMAIL_REFRESH_TOKEN (.env.local). */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const err = req.nextUrl.searchParams.get("error");

  if (err) {
    return htmlPage(`Erreur Google : ${err}`, false);
  }
  if (!code) {
    return htmlPage("Code OAuth manquant.", false);
  }

  const { clientId, clientSecret, redirectUri } = getGmailOAuthConfig();
  if (!clientId || !clientSecret) {
    return htmlPage("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants.", false);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  try {
    const { tokens } = await oauth2.getToken(code);
    const refresh = tokens.refresh_token ?? "(aucun — reconnectez avec prompt=consent)";
    const body = `
      <p>Ajoutez dans <code>.env.local</code> puis redémarrez <code>npm run dev</code> :</p>
      <pre style="background:#0f172a;color:#e2e8f0;padding:16px;border-radius:12px;overflow:auto">GMAIL_USER=alkhastvatsaev@gmail.com
GOOGLE_CLIENT_ID=${clientId}
GOOGLE_CLIENT_SECRET=votre_secret_ici
GMAIL_REFRESH_TOKEN=${refresh}</pre>
      <p><strong>Ne partagez pas ces valeurs.</strong> Fermez cette page après copie.</p>
    `;
    return htmlPage(body, true);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Échange de code échoué.";
    return htmlPage(msg, false);
  }
}

function htmlPage(inner: string, ok: boolean): NextResponse {
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Gmail BELGMAP</title></head>
<body style="font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px">
<h1 style="color:${ok ? "#059669" : "#dc2626"}">${ok ? "Gmail connecté" : "Échec"}</h1>
${inner}
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
