import type { ChatbotInvoiceRow } from "@/features/chatbot/chatbotInvoiceRows";
import { normalizeDocumentSearchText } from "@/features/chatbot/filterChatbotDocumentsParse";
import type { SupplierOrder } from "@/features/suppliers";
import { SUPPLIER_ORDER_STATUS_LABELS } from "@/features/suppliers";

function formatAmountHaystack(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return "";
  const euros = cents / 100;
  return [
    String(cents),
    euros.toFixed(2).replace(".", ","),
    euros.toFixed(2),
    euros.toFixed(0),
    `${euros.toLocaleString("fr-BE", { maximumFractionDigits: 0 })} eur`,
    `${euros.toLocaleString("fr-BE", { maximumFractionDigits: 2 })}`,
  ].join(" ");
}

function formatDateHaystack(raw: string | null | undefined): string {
  if (!raw) return "";
  let ms = 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    ms = (raw as { seconds: number }).seconds * 1000;
  } else {
    const parsed = Date.parse(String(raw));
    if (!Number.isFinite(parsed)) return String(raw);
    ms = parsed;
  }
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return [
    d.toISOString().slice(0, 10),
    d.toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" }),
    d.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" }),
    d.toLocaleDateString("fr-BE", { month: "long", year: "numeric" }),
    String(d.getDate()),
    String(d.getMonth() + 1),
    String(d.getFullYear()),
  ].join(" ");
}

function expandNameHaystack(label: string): string {
  const normalized = normalizeDocumentSearchText(label);
  const stripped = normalized
    .replace(/^(m|mr|mme|mlle|me|mrs|ms)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const parts = stripped.split(/\s+/).filter(Boolean);
  return [label, stripped, parts.join(" "), ...parts].filter(Boolean).join(" ");
}

export function chatbotInvoiceSearchHaystack(row: ChatbotInvoiceRow): string {
  const idTail = row.interventionId.slice(-8);
  return [
    expandNameHaystack(row.clientLabel),
    row.problem,
    row.status,
    row.interventionId,
    idTail,
    formatAmountHaystack(row.totalCents),
    formatDateHaystack(row.invoicedAt),
    "facture",
    "devis",
  ]
    .filter(Boolean)
    .join(" ");
}

export function supplierOrderSearchHaystack(order: SupplierOrder): string {
  const lines = order.lines ?? [];
  const lineText = lines
    .map((l) => [l.label, l.sku, String(l.quantity)].filter(Boolean).join(" "))
    .join(" ");
  const idTail = order.id.slice(-8);
  const ivTail = order.interventionId?.slice(-8) ?? "";
  return [
    order.id,
    idTail,
    order.interventionId,
    ivTail,
    order.supplierName,
    order.supplierId,
    order.status,
    SUPPLIER_ORDER_STATUS_LABELS[order.status],
    order.notes,
    lineText,
    formatAmountHaystack(order.totalCents),
    formatDateHaystack(order.createdAt),
    formatDateHaystack(order.deliveryDate),
    "commande",
    "bon",
    "fournisseur",
  ]
    .filter(Boolean)
    .join(" ");
}
