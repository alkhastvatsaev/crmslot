import type { jsPDF } from "jspdf";
import type { BillingPdfBranding } from "@/features/billing/billingPdfBranding";

const PAGE_H = 297;
const MARGIN = 14;
const FOOTER_BLOCK_H = 42;

export function formatBillingPdfDate(d: Date, placeName: string): string {
  const datePart = d.toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Brussels",
  });
  return `${placeName}, le ${datePart}`;
}

function imageFormat(dataUrl: string): "PNG" | "JPEG" {
  if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) return "JPEG";
  return "PNG";
}

function drawVectorStamp(doc: jsPDF, x: number, y: number, branding: BillingPdfBranding) {
  const w = 62;
  const h = 30;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, w, h, 2, 2);
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(branding.companyName.slice(0, 26), x + w / 2, y + 10, { align: "center" });
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  let lineY = y + 16;
  if (branding.vatNumber) {
    doc.text(`TVA ${branding.vatNumber}`, x + w / 2, lineY, { align: "center" });
    lineY += 4.5;
  }
  if (branding.addressLine) {
    doc.text(branding.addressLine.slice(0, 38), x + w / 2, lineY, { align: "center" });
  }
  doc.setTextColor(0, 0, 0);
}

function drawVectorSignature(doc: jsPDF, x: number, y: number, signerName: string) {
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.35);
  doc.line(x, y + 14, x + 52, y + 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(signerName, x, y + 20);
  doc.setFont("helvetica", "normal");
}

function addImageSafe(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  try {
    doc.addImage(dataUrl, imageFormat(dataUrl), x, y, w, h);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tampon (gauche), signature + date (droite), en bas de page A4.
 */
export function appendBillingPdfFooter(doc: jsPDF, afterTotalsY: number, branding: BillingPdfBranding) {
  let y = afterTotalsY + 14;
  if (y + FOOTER_BLOCK_H > PAGE_H - 12) {
    doc.addPage();
    y = 28;
  }

  const footerY = Math.max(y, PAGE_H - FOOTER_BLOCK_H - 18);
  const stampX = MARGIN;
  const sigX = 120;

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Cachet", stampX, footerY - 2);

  if (branding.stampImageDataUrl) {
    if (!addImageSafe(doc, branding.stampImageDataUrl, stampX, footerY, 34, 34)) {
      drawVectorStamp(doc, stampX, footerY, branding);
    }
  } else {
    drawVectorStamp(doc, stampX, footerY, branding);
  }

  doc.text("Signature", sigX, footerY - 2);

  if (branding.signatureImageDataUrl) {
    if (!addImageSafe(doc, branding.signatureImageDataUrl, sigX, footerY, 55, 22)) {
      drawVectorSignature(doc, sigX, footerY, branding.signerName);
    }
  } else {
    drawVectorSignature(doc, sigX, footerY, branding.signerName);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(formatBillingPdfDate(branding.issuedAt, branding.placeName), sigX, footerY + 30);
}
