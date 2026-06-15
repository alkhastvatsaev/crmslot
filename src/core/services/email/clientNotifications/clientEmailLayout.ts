import { resolvePublicAppBaseUrl } from "@/core/config/publicAppUrl";

export type ClientEmailLayoutInput = {
  preheader: string;
  heading: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeToken?: string | null;
};

const BRAND_BG = "#0a0a0a";
const BRAND_TEXT = "#f5f5f5";
const ACCENT = "#9ad9ff";
const MUTED = "#8a8f99";
const CARD_BG = "#141414";
const CARD_BORDER = "#222";
const CTA_BG = "#9ad9ff";
const CTA_TEXT = "#0a0a0a";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderClientEmailLayout(input: ClientEmailLayoutInput): string {
  const baseUrl = resolvePublicAppBaseUrl();
  const unsubscribeUrl = input.unsubscribeToken
    ? `${baseUrl}/api/portal/unsubscribe/${encodeURIComponent(input.unsubscribeToken)}`
    : null;

  const ctaBlock =
    input.ctaUrl && input.ctaLabel
      ? `
      <tr>
        <td align="center" style="padding:8px 24px 24px">
          <a href="${escapeHtml(input.ctaUrl)}"
             style="display:inline-block;background:${CTA_BG};color:${CTA_TEXT};text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px">
            ${escapeHtml(input.ctaLabel)}
          </a>
        </td>
      </tr>`
      : "";

  const footerBlock = unsubscribeUrl
    ? `
      <p style="margin:24px 0 0;font-size:11px;color:${MUTED};line-height:1.6">
        Vous recevez cet email parce que vous êtes client de notre service.
        <br>
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:${MUTED};text-decoration:underline">
          Se désabonner des notifications
        </a>
      </p>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(input.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${BRAND_TEXT}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_BG};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;width:100%;background:${CARD_BG};border:1px solid ${CARD_BORDER};border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:24px 28px 8px">
              <div style="font-size:13px;letter-spacing:2px;color:${ACCENT};font-weight:600">CRMSLOT</div>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:${BRAND_TEXT};font-weight:600">
                ${escapeHtml(input.heading)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 8px;font-size:15px;line-height:1.6;color:${BRAND_TEXT}">
              <p style="margin:0">${escapeHtml(input.intro)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 16px;font-size:15px;line-height:1.6;color:${BRAND_TEXT}">
              ${input.bodyHtml}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:0 28px 28px">
              ${footerBlock}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:${MUTED}">
          CRMSLOT · gestion d'interventions terrain
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderClientEmailText(input: {
  heading: string;
  intro: string;
  bodyLines: string[];
  ctaUrl?: string;
  ctaLabel?: string;
  unsubscribeToken?: string | null;
}): string {
  const baseUrl = resolvePublicAppBaseUrl();
  const lines = [input.heading, "", input.intro, "", ...input.bodyLines];
  if (input.ctaUrl && input.ctaLabel) {
    lines.push("", `${input.ctaLabel} : ${input.ctaUrl}`);
  }
  if (input.unsubscribeToken) {
    const url = `${baseUrl}/api/portal/unsubscribe/${encodeURIComponent(input.unsubscribeToken)}`;
    lines.push("", "—", `Se désabonner : ${url}`);
  }
  return lines.join("\n");
}
