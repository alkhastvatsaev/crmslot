import { logger } from "@/core/logger";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { sendViaGmailApi } from "@/core/services/email/sendViaGmailApi";
import type { SupplierOrderLine } from "@/features/suppliers/types";

export const LECOT_EMAIL = "info@lecot.be";

export type LecotOrderEmailInput = {
  orderId: string;
  companyId: string;
  lines: SupplierOrderLine[];
  totalCents: number;
  clientName?: string | null;
  notes?: string | null;
  reference?: string | null;
};

function formatEur(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2).replace(".", ",") + " €";
}

function buildHtml(input: LecotOrderEmailInput): string {
  const date = new Date().toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const ref = input.reference ?? input.orderId;

  const rows = input.lines
    .map((l) => {
      const lineCents = l.unitPriceCents * l.quantity;
      return `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#555;font-size:12px">${l.sku}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:13px">${l.label}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-size:13px">${l.quantity}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-size:13px">${l.unitPriceCents > 0 ? formatEur(l.unitPriceCents) : "—"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-size:13px">${lineCents > 0 ? formatEur(lineCents) : "—"}</td>
      </tr>`;
    })
    .join("");

  const notesBlock = input.notes
    ? `<p style="margin:16px 0 0;font-size:13px;color:#555"><strong>Notes :</strong> ${input.notes}</p>`
    : "";

  const clientBlock = input.clientName
    ? `<p style="margin:4px 0;font-size:13px;color:#555"><strong>Client :</strong> ${input.clientName}</p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f8f8f8;font-family:Arial,sans-serif">
<div style="max-width:620px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
  <div style="background:#1a1a2e;padding:20px 28px">
    <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600">Bon de commande</h1>
    <p style="margin:4px 0 0;color:#aab;font-size:12px">Transmis via CRMSLOT</p>
  </div>
  <div style="padding:24px 28px">
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Date :</strong> ${date}</p>
    <p style="margin:0 0 4px;font-size:13px;color:#555"><strong>Référence :</strong> ${ref}</p>
    ${clientBlock}
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">SKU</th>
          <th style="padding:8px 10px;text-align:left;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Désignation</th>
          <th style="padding:8px 10px;text-align:center;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Qté</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">P.U. HT</th>
          <th style="padding:8px 10px;text-align:right;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px">Total HT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="padding:10px 10px;text-align:right;font-weight:700;font-size:14px">Total HT</td>
          <td style="padding:10px 10px;text-align:right;font-weight:700;font-size:14px">${input.totalCents > 0 ? formatEur(input.totalCents) : "—"}</td>
        </tr>
      </tfoot>
    </table>
    ${notesBlock}
    <p style="margin:24px 0 0;font-size:12px;color:#aaa">Ce bon de commande a été généré automatiquement par CRMSLOT.</p>
  </div>
</div>
</body>
</html>`;
}

function buildText(input: LecotOrderEmailInput): string {
  const ref = input.reference ?? input.orderId;
  const lines = input.lines
    .map(
      (l) =>
        `- ${l.quantity}× ${l.label} (${l.sku})${l.unitPriceCents > 0 ? " — " + formatEur(l.unitPriceCents * l.quantity) : ""}`
    )
    .join("\n");
  return [
    `Bon de commande — réf. ${ref}`,
    input.clientName ? `Client : ${input.clientName}` : "",
    "",
    lines,
    "",
    `Total HT : ${formatEur(input.totalCents)}`,
    input.notes ? `\nNotes : ${input.notes}` : "",
    "\nCe bon de commande a été généré par CRMSLOT.",
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

/**
 * Envoie le bon de commande Lecot par email via Gmail OAuth.
 * Fire-and-forget — ne lève pas d'exception, retourne ok/error.
 */
export async function sendLecotOrderEmail(
  input: LecotOrderEmailInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    const configured = await isGmailOAuthConfigured();
    if (!configured) {
      return { ok: false, error: "Gmail OAuth non configuré — bon non envoyé par email." };
    }

    const ref = input.reference ?? input.orderId;
    const subject = input.clientName
      ? `Bon de commande Lecot — ${input.clientName} — réf. ${ref}`
      : `Bon de commande Lecot — réf. ${ref}`;

    const messageId = `<lecot-order-${input.orderId}-${Date.now()}@crmslot>`;

    await sendViaGmailApi({
      to: LECOT_EMAIL,
      subject,
      bodyText: buildText(input),
      bodyHtml: buildHtml(input),
      messageId,
      replyTo: LECOT_EMAIL,
    });

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[lecot-order] email non envoyé:", { error: msg });
    return { ok: false, error: msg };
  }
}
