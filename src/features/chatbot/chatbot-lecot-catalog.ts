import { LECOT_CATALOG } from "@/features/catalog/lecotCatalog";
import { loadCompanyCatalogProducts } from "@/features/catalog/loadCompanyCatalog";
import { lecotApiBaseUrl, searchLecotViaApi } from "@/features/catalog/lecotApiSearch";
import { isChatbotEmailIntent } from "@/features/chatbot/chatbot-email-intent";
import {
  extractLecotProductQueryFromFollowUp,
  LECOT_FLOW_CONTEXT_RE,
  normalizeLecotProductSearchQuery,
  priorUserTexts,
  resolveLecotCatalogSearchQuery,
} from "@/features/chatbot/chatbot-lecot-follow-up";
import { buildLecotProductQuickActions } from "@/features/chatbot/chatbot-quick-actions";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import { buildLecotSearchUrl } from "@/features/chatbot/chatbot-lecot-url";
import { STUB_CATALOG } from "@/features/catalog/productQuickAdd";
import type { CatalogProduct } from "@/features/catalog";
import {
  mergeCatalogProducts,
  searchCatalogProductsScored,
} from "@/features/catalog/searchCatalogProducts";

export { extractLecotProductQueryFromFollowUp } from "@/features/chatbot/chatbot-lecot-follow-up";

const LOCAL_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

/** Nombre d'articles proposés dans le chat (boutons + liste). */
export const LECOT_CHATBOT_SUGGESTION_COUNT = 5;

const LECOT_QUERY_ALIASES: Record<string, string> = {
  lecot: "serrure cylindre verrou serrurerie",
  catalogue: "serrure cylindre verrou serrurerie",
  materiel: "serrure cylindre verrou serrurerie",
  matériel: "serrure cylindre verrou serrurerie",
  perceuse: "perceuse visseuse outillage",
  visseuse: "perceuse visseuse outillage",
  perforateur: "perceuse percussion SDS outillage",
  meuleuse: "meuleuse outillage",
  serrure: "serrure multipoints verrou",
  verrou: "verrou serrure",
  poignée: "poignée hoppe rosace plaque",
  poignee: "poignée hoppe rosace plaque",
  gâche: "gâche électrique fermeture",
  gache: "gâche électrique fermeture",
  cylindre: "cylindre européen profil",
};

function expandLecotSearchQuery(query: string): string {
  const raw = normalizeLecotProductSearchQuery(query.trim());
  const key = raw.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return LECOT_QUERY_ALIASES[key] ?? raw;
}

export type LecotProductSuggestion = {
  rank: number;
  sku: string;
  label: string;
  unitPriceEur: number;
  unitPriceCents: number;
  lecotSearchUrl: string;
  markdownLink: string;
  imageUrl?: string | null;
};

export function buildLecotProductSuggestions(
  products: Array<{
    sku: string;
    label: string;
    unitPriceEur: number;
    unitPriceCents?: number;
    lecotSearchUrl: string;
    imageUrl?: string | null;
  }>,
  max = LECOT_CHATBOT_SUGGESTION_COUNT
): LecotProductSuggestion[] {
  return products.slice(0, max).map((p, i) => {
    const unitPriceCents = p.unitPriceCents ?? Math.round(p.unitPriceEur * 100);
    return {
      rank: i + 1,
      sku: p.sku,
      label: p.label,
      unitPriceEur: p.unitPriceEur,
      unitPriceCents,
      lecotSearchUrl: p.lecotSearchUrl,
      markdownLink: `[${p.label}](lecot:${p.lecotSearchUrl})`,
      ...(p.imageUrl ? { imageUrl: p.imageUrl } : {}),
    };
  });
}

export function syntheticLecotSku(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28)
    .toUpperCase();
  return `CUSTOM-${slug || "PIECE"}`;
}

export function formatProduct(p: CatalogProduct) {
  const label = p.label;
  return {
    sku: p.sku,
    label,
    unitPriceCents: p.unitPriceCents ?? 0,
    unitPriceEur: Math.round(p.unitPriceCents ?? 0) / 100,
    lecotSearchUrl: buildLecotSearchUrl(`${p.sku} ${label}`.trim()),
  };
}

export async function loadMergedCatalog(companyId: string): Promise<CatalogProduct[]> {
  let companyProducts: CatalogProduct[] = [];
  if (companyId) {
    try {
      companyProducts = await loadCompanyCatalogProducts(companyId);
    } catch {
      companyProducts = [];
    }
  }
  return mergeCatalogProducts(LOCAL_CATALOG, companyProducts);
}

export async function searchLecotProductsForChatbot(
  companyId: string,
  query: string,
  limitRaw?: number
) {
  const limit = Math.min(12, Math.max(1, Number(limitRaw) || LECOT_CHATBOT_SUGGESTION_COUNT));
  const q = expandLecotSearchQuery(query);
  const catalog = await loadMergedCatalog(companyId);

  if (q.length < 2) {
    const products = catalog.slice(0, LECOT_CHATBOT_SUGGESTION_COUNT).map(formatProduct);
    const suggestions = buildLecotProductSuggestions(products);
    return {
      products,
      suggestions,
      source: "local" as const,
      configured: Boolean(lecotApiBaseUrl()),
      hint: "Précisez le type de pièce (ex. perceuse, cylindre Yale).",
      instruction:
        "Présente jusqu'à 3 articles numérotés avec markdownLink et prix. L'utilisateur choisit le n° — appelle order_lecot_parts aussitôt (quantity=1, ne pas demander la quantité).",
    };
  }

  const remote = await searchLecotViaApi(q);
  if (remote && remote.length > 0) {
    const rankedRemote = searchCatalogProductsScored(remote, q, limit);
    const picked = rankedRemote.length > 0 ? rankedRemote : remote.slice(0, limit);
    const products = picked.map(formatProduct);
    const suggestions = buildLecotProductSuggestions(products);
    return {
      products,
      suggestions,
      source: "api" as const,
      configured: true,
      query: q,
      instruction:
        "Présente exactement les suggestions (markdownLink + prix) correspondant à la demande utilisateur — ne propose pas d'autres familles de produits (ex. pas de serrure si l'utilisateur a demandé une poignée). L'utilisateur choisit le n° — appelle order_lecot_parts aussitôt avec sku + label + unitPriceEur EXACT (quantity=1, ne pas demander).",
    };
  }

  const local = searchCatalogProductsScored(catalog, q, limit);
  const products = local.map(formatProduct);
  const suggestions = buildLecotProductSuggestions(products);

  if (products.length === 0) {
    if (isChatbotEmailIntent(q)) {
      return {
        products: [],
        suggestions: [],
        source: "local" as const,
        configured: Boolean(lecotApiBaseUrl()),
        query: q,
        matchCount: 0,
        hint: "Ce message concerne un email client, pas le catalogue Lecot. Utilisez send_intervention_email.",
        instruction: "Ne pas proposer de commande Lecot. Répondre via l'outil email.",
      };
    }
    const sku = syntheticLecotSku(q);
    return {
      products: [
        {
          sku,
          label: q,
          unitPriceCents: 0,
          unitPriceEur: 0,
          lecotSearchUrl: buildLecotSearchUrl(q),
        },
      ],
      source: "local_generated" as const,
      configured: Boolean(lecotApiBaseUrl()),
      query: q,
      matchCount: 0,
      noExactMatch: true,
      suggestions: buildLecotProductSuggestions([
        {
          sku,
          label: q,
          unitPriceEur: 0,
          lecotSearchUrl: buildLecotSearchUrl(q),
        },
      ]),
      hint: `Pas de référence catalogue — commande possible avec sku ${sku} et ce libellé via order_lecot_parts.`,
      instruction:
        "Aucun hit catalogue : propose le lien lecotSearchUrl et une commande sur description libre si l'utilisateur confirme.",
    };
  }

  return {
    products,
    suggestions,
    source: remote === null ? ("local" as const) : ("local_fallback" as const),
    configured: Boolean(lecotApiBaseUrl()),
    query: q,
    matchCount: products.length,
    hint:
      products.length === 1
        ? "Une correspondance — bouton Commander ou order_lecot_parts (quantity:1)."
        : "Plusieurs correspondances — boutons Commander ou order_lecot_parts (quantity:1).",
    instruction:
      products.length >= 2
        ? "Présente les suggestions (markdownLink + prix). Ne demande jamais la quantité. order_lecot_parts : sku + label + quantity:1 + unitPriceEur exact."
        : "Une correspondance — order_lecot_parts : sku + label + quantity:1 + unitPriceEur exact, sans demander la quantité.",
  };
}

export function formatLecotSearchReplyForChat(
  result: Awaited<ReturnType<typeof searchLecotProductsForChatbot>>
): string {
  const suggestions = result.suggestions ?? [];
  if (suggestions.length === 0) {
    return "Aucun article trouvé dans le catalogue. Précisez le type de pièce (référence ou description).";
  }
  const lines = suggestions.map((s) => {
    const price =
      s.unitPriceEur > 0 ? ` — ${s.unitPriceEur.toFixed(2)} € HT` : " — prix à confirmer";
    return `${s.rank}. ${s.markdownLink}${price} (SKU ${s.sku})`;
  });
  const suggestionTags = suggestions
    .map((s) => `<suggestion>Commander ${s.rank}</suggestion>`)
    .join("");
  const footer =
    suggestions.length === 1
      ? "\n\nCommandez en 1 clic ci-dessous (quantité : 1)."
      : "\n\nChoisissez un article ci-dessous — commande immédiate, quantité 1.";
  return `**Catalogue Lecot** (recherche locale, 0 token) :\n${lines.join("\n")}${footer}${suggestionTags}`;
}

export async function runChatbotInstantLecotSearch(
  companyId: string,
  query: string,
  limit = LECOT_CHATBOT_SUGGESTION_COUNT
): Promise<string> {
  const result = await searchLecotProductsForChatbot(companyId, query, limit);
  return formatLecotSearchReplyForChat(result);
}

export async function streamInstantLecotCatalogResponse(params: {
  companyId: string;
  query: string;
  messages: unknown[];
  enqueue: (ev: unknown) => void;
  suggestionLimit?: number;
}): Promise<void> {
  const limit = params.suggestionLimit ?? LECOT_CHATBOT_SUGGESTION_COUNT;
  const result = await searchLecotProductsForChatbot(params.companyId, params.query, limit);
  const reply = formatLecotSearchReplyForChat(result);
  const stored = normalizeStoredMessages(params.messages);
  const actions = buildLecotProductQuickActions(result.suggestions ?? []);
  params.enqueue({ type: "text", delta: reply });
  if (actions.length > 0) {
    params.enqueue({ type: "quick_actions", actions });
  }
  params.enqueue({
    type: "done",
    apiMessages: [...stored, { role: "assistant", content: reply }],
  });
}

export async function tryLecotProductFollowUpIntent(
  lastText: string,
  messages: unknown[],
  companyId: string
): Promise<string | null> {
  const prior = priorUserTexts(messages);
  if (prior.length === 0 || !LECOT_FLOW_CONTEXT_RE.test(prior.join(" "))) return null;
  const query = resolveLecotCatalogSearchQuery(lastText, messages);
  if (!query) return null;
  return runChatbotInstantLecotSearch(companyId, query);
}
