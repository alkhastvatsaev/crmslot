import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Intervention } from "./types";

function fmt(cents: number): string {
  return (cents / 100).toFixed(2) + " EUR";
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function buildInterventionReportPdf(intervention: Intervention): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 14;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Rapport d'intervention", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Dossier n° ${intervention.id}`, margin, y);
  doc.setTextColor(0);
  y += 10;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Info bloc
  const infos: [string, string][] = [
    ["Client", intervention.clientName ?? (`${intervention.clientFirstName ?? ""} ${intervention.clientLastName ?? ""}`.trim() || "—")],
    ["Adresse", intervention.address ?? "—"],
    ["Catégorie", intervention.category ?? "—"],
    ["Statut", intervention.status],
    ["Date création", formatDate(intervention.createdAt)],
    ["Date intervention", intervention.scheduledDate ? `${intervention.scheduledDate} ${intervention.scheduledTime ?? ""}`.trim() : "—"],
    ["Durée réelle", intervention.actualDurationMinutes ? `${intervention.actualDurationMinutes} min` : "—"],
    ["Clôturé le", formatDate(intervention.completedAt)],
  ];

  for (const [label, value] of infos) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label + " :", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 40, y);
    y += 6;
  }

  y += 4;
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Billing lines
  const lines = intervention.billingLines ?? [];
  if (lines.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Lignes de facturation", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Description", "Référence", "Qté", "P.U. HT", "Total HT"]],
      body: lines.map((l) => [
        l.description,
        l.reference ?? "—",
        String(l.quantity),
        fmt(l.unitPriceCents),
        fmt(Math.round(l.quantity * l.unitPriceCents)),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 30, 30] },
      margin: { left: margin, right: margin },
    });

    const totalHT = lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPriceCents), 0);
    const tva = Math.round(totalHT * 0.06);
    const finalY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;

    y = finalY + 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Total HT : ${fmt(totalHT)}`, W - margin - 50, y, { align: "right" });
    y += 5;
    doc.text(`TVA (6%) : ${fmt(tva)}`, W - margin - 50, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(`Total TTC : ${fmt(totalHT + tva)}`, W - margin - 50, y, { align: "right" });
    y += 10;
  }

  // Notes
  if (intervention.problem) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Problème signalé", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize(intervention.problem ?? "", W - 2 * margin);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 6;
  }

  // Signature
  if (intervention.completionSignatureUrl) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Signature client", margin, y);
    y += 5;
    try {
      doc.addImage(intervention.completionSignatureUrl, "PNG", margin, y, 60, 25);
    } catch {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("[Signature disponible en ligne]", margin, y + 10);
    }
    y += 30;
  }

  // Footer
  const pageHeight = 297;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Généré le ${formatDate(new Date().toISOString())}  •  BELGMAP`,
    margin,
    pageHeight - 10,
  );

  return new Uint8Array(doc.output("arraybuffer"));
}
