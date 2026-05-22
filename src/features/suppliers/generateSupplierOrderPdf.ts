import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SupplierOrder } from "@/features/suppliers/types";
import { SUPPLIER_ORDER_STATUS_LABELS } from "@/features/suppliers/types";

function formatEur(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatWhen(raw: unknown): string {
  if (!raw) return new Date().toLocaleDateString("fr-BE");
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return new Date((raw as { seconds: number }).seconds * 1000).toLocaleDateString("fr-BE");
  }
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("fr-BE") : new Date().toLocaleDateString("fr-BE");
}

export function generateSupplierOrderPdf(
  order: SupplierOrder,
  opts?: { companyName?: string; clientName?: string },
): Uint8Array {
  const doc = new jsPDF();
  const clientLabel = (order.clientName ?? opts?.clientName ?? "").trim();

  doc.setFontSize(16);
  doc.text("Bon de commande fournisseur", 14, 18);
  doc.setFontSize(11);
  let y = 28;
  doc.text(`Fournisseur : ${order.supplierName}`, 14, y);
  y += 7;
  if (clientLabel) {
    doc.text(`Nom : ${clientLabel}`, 14, y);
    y += 7;
  }
  doc.text(`Réf. commande : ${order.id}`, 14, y);
  y += 7;
  doc.text(`Date : ${formatWhen(order.createdAt)}`, 14, y);
  y += 7;
  doc.text(`Statut : ${SUPPLIER_ORDER_STATUS_LABELS[order.status]}`, 14, y);
  y += 7;
  if (opts?.companyName) {
    doc.text(`Société : ${opts.companyName}`, 14, y);
    y += 7;
  }

  const startY = y + 5;
  autoTable(doc, {
    startY,
    head: [["Réf.", "Désignation", "Qté", "P.U. HT", "Total HT"]],
    body: order.lines.map((l) => {
      const unit = formatEur(l.unitPriceCents);
      const total = formatEur(Math.round(l.quantity * l.unitPriceCents));
      return [l.sku, l.label, String(l.quantity), unit, total];
    }),
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY + 20;
  doc.setFontSize(12);
  doc.text(`Total HT : ${formatEur(order.totalCents)}`, 14, finalY + 10);
  if (order.notes?.trim()) {
    doc.setFontSize(10);
    doc.text(`Notes : ${order.notes.trim().slice(0, 200)}`, 14, finalY + 18);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
