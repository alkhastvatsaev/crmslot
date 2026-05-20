import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { appendBillingPdfFooter } from "@/features/billing/appendBillingPdfFooter";
import type { BillingPdfBranding } from "@/features/billing/billingPdfBranding";
import {
  BILLING_PDF_COLORS,
  BILLING_PDF_MARGIN as M,
  BILLING_PDF_PAGE_W,
  formatBillingDocDate,
  formatBillingDocRef,
  formatBillingMoney,
} from "@/features/billing/billingPdfTheme";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";
import type { Intervention } from "@/features/interventions/types";

type BillingLine = NonNullable<Intervention["billingLines"]>[number];

const C = BILLING_PDF_COLORS;
const RIGHT = BILLING_PDF_PAGE_W - M;

function subtotalCents(lines: BillingLine[]): number {
  return lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPriceCents), 0);
}

function setColor(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function drawHeader(
  doc: jsPDF,
  branding: BillingPdfBranding,
  docKind: "invoice" | "quote",
  interventionId: string,
) {
  const isInvoice = docKind === "invoice";
  const docLabel = isInvoice ? "FACTURE" : "DEVIS";
  const ref = formatBillingDocRef(interventionId);
  const issued = formatBillingDocDate(branding.issuedAt);

  doc.setFillColor(...C.accent);
  doc.rect(0, 0, 2.5, 42, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setColor(doc, C.primary);
  const companyLines = doc.splitTextToSize(branding.companyName.toUpperCase(), 95);
  doc.text(companyLines, M, 22);

  const tagY = 22 + companyLines.length * 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, C.secondary);
  doc.text("Serrurerie · Sécurité · Dépannage", M, tagY);
  if (branding.vatNumber) {
    doc.text(`TVA ${branding.vatNumber}`, M, tagY + 4.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, C.primary);
  doc.text(docLabel, RIGHT, 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, C.secondary);
  doc.text(`N° ${ref}`, RIGHT, 27, { align: "right" });
  doc.text(issued, RIGHT, 33, { align: "right" });
  if (!isInvoice) {
    doc.setFontSize(8);
    setColor(doc, C.muted);
    doc.text("Validité : 30 jours", RIGHT, 38, { align: "right" });
  }

  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.35);
  doc.line(M, 46, RIGHT, 46);
}

function drawClientBlock(doc: jsPDF, iv: Intervention) {
  const client = resolveInterventionClientName(iv);
  const address = (iv.address ?? "—").trim();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setColor(doc, C.muted);
  doc.text("DESTINATAIRE", M, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  setColor(doc, C.primary);
  const nameLines = doc.splitTextToSize(client, 88);
  doc.text(nameLines, M, 63);

  doc.setFontSize(9);
  setColor(doc, C.secondary);
  const addrY = 63 + nameLines.length * 5.2;
  const addrLines = doc.splitTextToSize(address, 88);
  doc.text(addrLines, M, addrY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setColor(doc, C.muted);
  doc.text("INTERVENTION", 118, 56);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, C.secondary);
  const problem = (iv.problem ?? iv.title ?? "Prestation").trim();
  doc.text(doc.splitTextToSize(problem, 72), 118, 63);
}

function drawLinesTable(doc: jsPDF, lines: BillingLine[], startY: number): number {
  if (lines.length === 0) return startY;

  autoTable(doc, {
    startY,
    margin: { left: M, right: M },
    head: [["Description", "Qté", "P.U. HT", "Total HT"]],
    body: lines.map((l) => {
      const lineTotal = Math.round(l.quantity * l.unitPriceCents);
      return [
        l.description,
        String(l.quantity),
        formatBillingMoney(l.unitPriceCents),
        formatBillingMoney(lineTotal),
      ];
    }),
    theme: "plain",
    styles: {
      fontSize: 9,
      textColor: C.secondary,
      cellPadding: { top: 3.5, bottom: 3.5, left: 1, right: 2 },
      lineColor: C.border,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: C.primary,
      textColor: C.white,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: 4,
    },
    alternateRowStyles: { fillColor: C.light },
    columnStyles: {
      0: { cellWidth: 92 },
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "right", cellWidth: 28 },
      3: { halign: "right", cellWidth: 28 },
    },
  });

  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY;
}

function drawTotals(
  doc: jsPDF,
  lines: BillingLine[],
  footerLabel: string,
  startY: number,
): number {
  const ht = subtotalCents(lines);
  const tva = Math.round(ht * 0.06);
  const ttc = ht + tva;

  let y = startY + 12;
  const pageH = doc.internal.pageSize.height;
  if (y > pageH - 75) {
    doc.addPage();
    y = 36;
  }

  const labelX = 118;
  const valueX = RIGHT;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, C.secondary);
  doc.text("Total hors taxes", labelX, y);
  doc.text(formatBillingMoney(ht), valueX, y, { align: "right" });
  y += 7;
  doc.text("TVA 6 %", labelX, y);
  doc.text(formatBillingMoney(tva), valueX, y, { align: "right" });

  y += 5;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.25);
  doc.line(labelX, y, valueX, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, C.primary);
  doc.text(footerLabel, labelX, y);
  doc.setTextColor(...C.accent);
  doc.text(formatBillingMoney(ttc), valueX, y, { align: "right" });
  doc.setTextColor(0, 0, 0);

  return y;
}

/** PDF facture ou devis — mise en page premium minimaliste. */
export function buildPremiumBillingPdf(
  iv: Intervention,
  docKind: "invoice" | "quote",
  footerLabel: string,
  branding: BillingPdfBranding,
): Uint8Array {
  const doc = new jsPDF();

  drawHeader(doc, branding, docKind, iv.id);
  drawClientBlock(doc, iv);

  const lines = iv.billingLines ?? [];
  const tableEnd = drawLinesTable(doc, lines, 88);
  const totalsY = drawTotals(doc, lines, footerLabel, tableEnd);

  appendBillingPdfFooter(doc, totalsY, branding);

  return new Uint8Array(doc.output("arraybuffer"));
}
