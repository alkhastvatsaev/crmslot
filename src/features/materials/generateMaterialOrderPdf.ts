import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { MaterialOrderDoc } from "@/features/materials/materialOrderFirestore";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  ordered: "Commandé",
  received: "Reçu",
  cancelled: "Annulé",
};

function formatWhen(raw: unknown): string {
  if (!raw) return "—";
  const t =
    typeof raw === "object" && raw !== null && "seconds" in raw
      ? (raw as { seconds: number }).seconds * 1000
      : Date.parse(String(raw));
  return Number.isFinite(t)
    ? new Date(t).toLocaleDateString("fr-BE", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

/** PDF récapitulatif des bons matériel d'un dossier. */
export function generateMaterialOrdersPdf(
  interventionId: string,
  orders: MaterialOrderDoc[],
  clientLabel?: string,
): Uint8Array {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Bons de commande matériel", 14, 18);
  doc.setFontSize(11);
  doc.text(`Dossier : ${interventionId}`, 14, 28);
  if (clientLabel) doc.text(`Client : ${clientLabel}`, 14, 35);

  let y = clientLabel ? 44 : 36;
  if (orders.length === 0) {
    doc.text("Aucune commande matériel enregistrée.", 14, y);
    return new Uint8Array(doc.output("arraybuffer"));
  }

  for (const order of orders.slice(0, 8)) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const orderClient = (order.clientName ?? clientLabel ?? "").trim();
    const clientSuffix = orderClient ? ` — ${orderClient}` : "";
    doc.text(
      `Bon #${order.id.slice(0, 10)} — ${STATUS_LABELS[order.status] ?? order.status}${clientSuffix} — ${formatWhen(order.createdAt)}`,
      14,
      y,
    );
    doc.setFont("helvetica", "normal");
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["Désignation", "Réf.", "Qté"]],
      body: order.partsRequested.map((p) => [
        p.description,
        p.reference ?? "—",
        String(p.quantity),
      ]),
      margin: { left: 14 },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 12;
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
