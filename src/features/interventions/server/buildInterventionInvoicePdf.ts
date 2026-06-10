import { randomUUID } from "crypto";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type BillingLineInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  reference?: string;
};

type InterventionInvoiceInput = {
  id: string;
  title?: string;
  address?: string;
  clientName?: string | null;
  problem?: string | null;
  invoiceAmountCents?: number;
  invoiceNumber?: string | null;
  billingLines?: BillingLineInput[];
};

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function buildInterventionInvoicePdfBuffer(iv: InterventionInvoiceInput): Buffer {
  const activeLines = (iv.billingLines ?? []).filter(
    (l) => l.description.trim() && l.quantity > 0 && l.unitPriceCents > 0
  );
  const htCents =
    activeLines.length > 0
      ? activeLines.reduce((sum, l) => sum + Math.round(l.quantity * l.unitPriceCents), 0)
      : typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0
        ? Math.round(iv.invoiceAmountCents)
        : 22000;
  const tvaCents = Math.round(htCents * 0.06);
  const ttcCents = htCents + tvaCents;

  const doc = new jsPDF();

  const colors = {
    primary: [15, 23, 42] as [number, number, number],
    secondary: [71, 85, 105] as [number, number, number],
    accent: [5, 150, 105] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
  };

  const client =
    (typeof iv.clientName === "string" && iv.clientName.trim()) ||
    (typeof iv.title === "string" && iv.title.trim()) ||
    "Client";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...colors.primary);
  doc.text("MAP BELGIQUE", 20, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  doc.text("FACTURE — Intervention terrain", 20, 30);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text(`N° ${iv.invoiceNumber?.trim() || iv.id}`, 140, 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  doc.text(`Date : ${new Date().toLocaleDateString("fr-BE")}`, 140, 30);

  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.4);
  doc.line(20, 38, 190, 38);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("Client", 20, 50);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  doc.text(client, 20, 57);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("Adresse d’intervention", 20, 68);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  const addrLines = doc.splitTextToSize(iv.address?.trim() || "—", 170);
  doc.text(addrLines, 20, 75);

  let y = 75 + addrLines.length * 5 + 10;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("Objet", 20, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  const prob = iv.problem?.trim() || iv.title?.trim() || "Prestation serrurerie";
  const probLines = doc.splitTextToSize(prob, 170);
  doc.text(probLines, 20, y + 7);

  y += 7 + probLines.length * 5 + 8;

  const tableBody: string[][] =
    activeLines.length > 0
      ? activeLines.map((l) => [
          l.description.trim() + (l.reference ? ` [${l.reference}]` : ""),
          String(l.quantity),
          formatEur(l.unitPriceCents),
          formatEur(Math.round(l.quantity * l.unitPriceCents)),
        ])
      : [
          [
            "Prestation terrain — intervention réalisée et validée (photos + signature)",
            "1",
            formatEur(htCents),
            formatEur(htCents),
          ],
        ];

  autoTable(doc, {
    startY: y,
    head: [["Description", "Qté", "Prix HT", "Total HT"]],
    body: tableBody,
    headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: colors.secondary },
    margin: { left: 20, right: 20 },
    theme: "striped",
  });

  const tableBottom =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
  const finalY = tableBottom + 14;

  const labelX = 120;
  const valX = 190;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.secondary);
  doc.text("Total HT :", labelX, finalY);
  doc.text(formatEur(htCents), valX, finalY, { align: "right" });
  doc.text("TVA (6 %) :", labelX, finalY + 8);
  doc.text(formatEur(tvaCents), valX, finalY + 8, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...colors.accent);
  doc.text("Total TTC :", labelX, finalY + 20);
  doc.text(formatEur(ttcCents), valX, finalY + 20, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...colors.secondary);
  doc.text("Document généré automatiquement — MAP BELGIQUE", 105, 285, { align: "center" });

  const arrayBuf = doc.output("arraybuffer");
  return Buffer.from(arrayBuf);
}

export function firebaseDownloadUrl(bucketName: string, objectPath: string, token: string): string {
  const enc = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${enc}?alt=media&token=${token}`;
}

export function newDownloadToken(): string {
  return randomUUID();
}
