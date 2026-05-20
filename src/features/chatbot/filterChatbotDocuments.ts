import type { ChatbotInvoiceRow } from "@/features/chatbot/chatbotInvoiceRows";
import type { SupplierOrder } from "@/features/suppliers/types";
import { SUPPLIER_ORDER_STATUS_LABELS } from "@/features/suppliers/types";

export type DocumentsSearchKindFilter = "all" | "invoice" | "order";

export type ParsedDocumentsSearchQuery = {
  kindFilter: DocumentsSearchKindFilter;
  textTokens: string[];
  hasQuery: boolean;
};

const INVOICE_HINTS = new Set([
  "facture",
  "factures",
  "invoice",
  "invoices",
  "facturation",
  "devis",
  "devises",
  "pdf",
]);

const ORDER_HINTS = new Set([
  "commande",
  "commandes",
  "bon",
  "bons",
  "order",
  "orders",
  "fournisseur",
  "fournisseurs",
  "lecot",
  "materiel",
  "achat",
  "achats",
  "stock",
]);

const HONORIFIC_TOKENS = new Set([
  "m",
  "mr",
  "mme",
  "mlle",
  "monsieur",
  "madame",
  "mademoiselle",
  "me",
  "mrs",
  "ms",
]);

const MONTH_LABELS = [
  "janvier",
  "fevrier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "aout",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "decembre",
  "décembre",
];

export function normalizeDocumentSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}\s,.@#/+_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tokenise en respectant les guillemets (« porte bloquee » = un seul critère). */
export function tokenizeDocumentSearchQuery(raw: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]+)"|'([^']+)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    const chunk = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (!chunk) continue;
    for (const part of normalizeDocumentSearchText(chunk).split(/\s+/)) {
      const bare = part.replace(/\./g, "").trim();
      if (part.length > 0 && !HONORIFIC_TOKENS.has(part) && !HONORIFIC_TOKENS.has(bare)) {
        tokens.push(bare.length > 0 && bare !== part ? bare : part);
      }
    }
  }
  return tokens;
}

export function parseDocumentsSearchQuery(raw: string): ParsedDocumentsSearchQuery {
  const tokens = tokenizeDocumentSearchQuery(raw);
  let kindFilter: DocumentsSearchKindFilter = "all";
  const textTokens: string[] = [];

  for (const token of tokens) {
    if (INVOICE_HINTS.has(token)) {
      if (kindFilter === "order") kindFilter = "all";
      else kindFilter = "invoice";
      continue;
    }
    if (ORDER_HINTS.has(token)) {
      if (kindFilter === "invoice") kindFilter = "all";
      else kindFilter = "order";
      continue;
    }
    textTokens.push(token);
  }

  return {
    kindFilter,
    textTokens,
    hasQuery: raw.trim().length > 0,
  };
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

function maxFuzzyDistance(tokenLen: number): number {
  if (tokenLen <= 3) return 0;
  if (tokenLen <= 6) return 1;
  return 2;
}

type ParsedAmount = { cents: number; variants: string[] };

function parseAmountToken(token: string): ParsedAmount | null {
  const cleaned = token.replace(/\s/g, "").replace(/€/g, "").replace(/eur/g, "");
  if (!/^\d+([,.]\d{1,2})?$/.test(cleaned)) return null;
  const normalized = cleaned.replace(",", ".");
  const euros = Number.parseFloat(normalized);
  if (!Number.isFinite(euros) || euros < 0) return null;
  const cents = Math.round(euros * 100);
  const eurosInt = Math.round(euros);
  return {
    cents,
    variants: [
      String(cents),
      String(eurosInt),
      euros.toFixed(2).replace(".", ","),
      euros.toFixed(2),
      eurosInt.toLocaleString("fr-BE"),
    ],
  };
}

function parseDateToken(token: string): string[] | null {
  const slash = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/.exec(token);
  if (slash) {
    const day = slash[1].padStart(2, "0");
    const month = slash[2].padStart(2, "0");
    const year = slash[3] ? (slash[3].length === 2 ? `20${slash[3]}` : slash[3]) : "";
    return year
      ? [`${year}-${month}-${day}`, `${day}/${month}/${year}`, `${day}.${month}.${year}`]
      : [`-${month}-${day}`, `${day}/${month}`, `${month}/${day}`];
  }
  if (/^\d{4}$/.test(token)) return [token];
  if (MONTH_LABELS.includes(token)) return [token];
  return null;
}

function haystackWords(haystack: string): string[] {
  return normalizeDocumentSearchText(haystack)
    .split(/[\s,.;:/#@+_-]+/)
    .filter((w) => w.length > 0);
}

/** Score d’un token sur un haystack (0 = pas de correspondance). */
export function scoreDocumentSearchToken(haystack: string, token: string): number {
  const t = normalizeDocumentSearchText(token);
  if (!t) return 0;

  const h = normalizeDocumentSearchText(haystack);
  const words = haystackWords(haystack);

  const amount = parseAmountToken(t);
  if (amount) {
    return amount.variants.some((v) => h.includes(normalizeDocumentSearchText(v))) ? 14 : 0;
  }

  const dateParts = parseDateToken(t);
  if (dateParts) {
    return dateParts.some((p) => h.includes(normalizeDocumentSearchText(p))) ? 12 : 0;
  }

  if (h.includes(t)) return 18 + Math.min(t.length, 10);

  if (t.length >= 4) {
    for (const word of words) {
      if (word.endsWith(t) || word.startsWith(t)) return 13;
      if (word.includes(t)) return 11;
    }
  }

  let best = 0;
  const fuzzyMax = maxFuzzyDistance(t.length);
  for (const word of words) {
    if (word.startsWith(t)) best = Math.max(best, 15);
    else if (t.length >= 3 && word.length >= 3) {
      const dist = levenshtein(t, word);
      if (dist <= fuzzyMax) best = Math.max(best, 12 - dist * 2);
      if (t.length >= 4 && word.includes(t.slice(0, Math.max(3, t.length - 1)))) {
        best = Math.max(best, 8);
      }
    }
  }
  return best;
}

export function scoreDocumentSearchTokens(haystack: string, textTokens: string[]): number {
  if (textTokens.length === 0) return 1;
  let total = 0;
  for (const token of textTokens) {
    const score = scoreDocumentSearchToken(haystack, token);
    if (score <= 0) return 0;
    total += score;
  }
  return total;
}

/** @deprecated Préférer scoreDocumentSearchTokens pour le classement. */
export function matchesDocumentSearchTokens(haystack: string, textTokens: string[]): boolean {
  return scoreDocumentSearchTokens(haystack, textTokens) > 0;
}

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

function sortBySearchScore<T>(rows: T[], haystackFor: (row: T) => string, parsed: ParsedDocumentsSearchQuery): T[] {
  return rows
    .map((row) => ({
      row,
      score: scoreDocumentSearchTokens(haystackFor(row), parsed.textTokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.row);
}

export function filterChatbotInvoices(
  rows: ChatbotInvoiceRow[],
  parsed: ParsedDocumentsSearchQuery,
): ChatbotInvoiceRow[] {
  if (parsed.kindFilter === "order") return [];
  return sortBySearchScore(rows, chatbotInvoiceSearchHaystack, parsed);
}

export function filterChatbotSupplierOrders(
  rows: SupplierOrder[],
  parsed: ParsedDocumentsSearchQuery,
): SupplierOrder[] {
  if (parsed.kindFilter === "invoice") return [];
  return sortBySearchScore(rows, supplierOrderSearchHaystack, parsed);
}
