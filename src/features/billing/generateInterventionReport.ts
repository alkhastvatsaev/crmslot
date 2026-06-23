import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Intervention } from "@/features/interventions";
import { saveOrShareDocument } from "@/core/native/nativeDocumentSave";

const C = {
  primary: [15, 23, 42] as [number, number, number],
  secondary: [71, 85, 105] as [number, number, number],
  accent: [37, 99, 235] as [number, number, number],
  green: [5, 150, 105] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  light: [248, 250, 252] as [number, number, number],
};

function fmtDate(val?: string | null) {
  if (!val) return "—";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? val : d.toLocaleString("fr-BE");
}

function clientName(iv: Intervention): string {
  if (iv.clientCompanyName) return iv.clientCompanyName;
  return [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ") || iv.clientName || "—";
}

function stars(n?: number | null) {
  if (!n) return "—";
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function generateInterventionReport(iv: Intervention): Promise<unknown> {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.width;

  // ── Header ──
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, pw, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("RAPPORT D'INTERVENTION", 20, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 230);
  doc.text(`Généré le ${fmtDate(new Date().toISOString())}`, 20, 26);
  doc.text(`Dossier : ${iv.id}`, 20, 31);

  // ── Client + Adresse ──
  let y = 50;
  doc.setTextColor(...C.primary);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("INFORMATIONS CLIENT", 20, y);
  y += 6;

  const infoRows: [string, string][] = [
    ["Client", clientName(iv)],
    ["Adresse", iv.address || "—"],
    ["Téléphone", iv.phone || iv.clientPhone || "—"],
    ["Mail", iv.clientEmail || "—"],
    ["Problème", iv.problem || iv.title || "—"],
  ];

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40, textColor: C.secondary },
      1: { textColor: C.primary },
    },
    margin: { left: 20, right: 20 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Timeline ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.primary);
  doc.text("CHRONOLOGIE", 20, y);
  y += 4;

  const timelineRows: [string, string][] = [
    ["Création", fmtDate(iv.createdAt)],
    ["Assignation", fmtDate(iv.technicianAcceptedAt)],
    ["Clôture", fmtDate(iv.completedAt)],
    ["Facturé", fmtDate(iv.invoicedAt)],
    ["Statut final", iv.status],
  ];

  autoTable(doc, {
    startY: y,
    body: timelineRows,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: C.light },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40, textColor: C.secondary },
      1: { textColor: C.primary },
    },
    margin: { left: 20, right: 20 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Lignes de facturation ──
  if (iv.billingLines && iv.billingLines.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.primary);
    doc.text("FACTURATION", 20, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Description", "Qté", "P.U.", "Total"]],
      body: iv.billingLines.map((l) => [
        l.description,
        String(l.quantity),
        `${(l.unitPriceCents / 100).toFixed(2)} €`,
        `${((l.quantity * l.unitPriceCents) / 100).toFixed(2)} €`,
      ]),
      headStyles: { fillColor: C.primary, textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left: 20, right: 20 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    if (iv.invoiceAmountCents) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...C.accent);
      doc.text(`Total : ${(iv.invoiceAmountCents / 100).toFixed(2)} €`, pw - 20, y, {
        align: "right",
      });
      y += 10;
    }
  }

  // ── Satisfaction client ──
  if (iv.clientRating) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.primary);
    doc.text("SATISFACTION CLIENT", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(...C.accent);
    doc.text(stars(iv.clientRating), 20, y);
    y += 6;
    if (iv.clientComment) {
      doc.setFontSize(9);
      doc.setTextColor(...C.secondary);
      const lines = doc.splitTextToSize(`"${iv.clientComment}"`, pw - 40);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 4;
    }
  }

  // ── Photos (références) ──
  const photos =
    iv.completionPhotos ??
    (iv.completionPhotoUrls ?? []).map((url) => ({ url, category: "autre" as const }));
  if (photos.length > 0) {
    if (y > doc.internal.pageSize.height - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...C.primary);
    doc.text(`PHOTOS DE FIN (${photos.length})`, 20, y);
    y += 6;
    photos.forEach((p, i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.secondary);
      doc.textWithLink(`Photo ${i + 1} — ${p.category}`, 20, y, { url: p.url });
      y += 5;
    });
  }

  // ── Footer ──
  const fh = doc.internal.pageSize.height - 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.border);
  doc.text("Document généré automatiquement par CRMSLOT", pw / 2, fh, { align: "center" });

  const clientLabel = clientName(iv).replace(/\s+/g, "_").slice(0, 30);
  const filename = `Rapport_${clientLabel}_${iv.id.slice(0, 8)}.pdf`;
  const bytes = new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
  return saveOrShareDocument({
    filename,
    bytes,
    mimeType: "application/pdf",
    shareTitle: `Rapport intervention — ${clientLabel}`,
  });
}
