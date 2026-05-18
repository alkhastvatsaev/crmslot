import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Intervention } from "@/features/interventions/types";

export function generateInterventionQuotePdf(iv: Intervention): Uint8Array {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Devis / Bon d'intervention", 14, 18);
  doc.setFontSize(11);
  doc.text(`Dossier: ${iv.id}`, 14, 28);
  doc.text(`Client: ${iv.clientName ?? "—"}`, 14, 35);
  doc.text(`Adresse: ${iv.address ?? "—"}`, 14, 42);

  const lines = iv.billingLines ?? [];
  if (lines.length > 0) {
    autoTable(doc, {
      startY: 50,
      head: [["Description", "Qté", "P.U. €", "Total €"]],
      body: lines.map((l) => {
        const unit = (l.unitPriceCents / 100).toFixed(2);
        const total = ((l.quantity * l.unitPriceCents) / 100).toFixed(2);
        return [l.description, String(l.quantity), unit, total];
      }),
    });
  }

  const totalCents = lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  doc.text(`Total TTC indicatif: ${(totalCents / 100).toFixed(2)} €`, 14, finalY + 12);

  return new Uint8Array(doc.output("arraybuffer"));
}
