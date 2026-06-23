import type {
  DocumentsSearchKindFilter,
  ParsedDocumentsSearchQuery,
} from "@/features/chatbot/filterChatbotDocumentsTypes";

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
