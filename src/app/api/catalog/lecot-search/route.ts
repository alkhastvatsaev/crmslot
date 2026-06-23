import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { LECOT_CATALOG } from "@/features/catalog";
import { loadCompanyCatalogProducts } from "@/features/catalog";
import { lecotApiBaseUrl, searchLecotViaApi } from "@/features/catalog/lecotApiSearch";
import { mergeCatalogProducts, searchCatalogProducts } from "@/features/catalog";
import { filterCatalogForIntervention, STUB_CATALOG } from "@/features/catalog/productQuickAdd";

export const runtime = "nodejs";

const LOCAL_CATALOG = mergeCatalogProducts(LECOT_CATALOG, STUB_CATALOG);

async function catalogForCompany(companyId?: string, category?: string) {
  const companyProducts = companyId ? await loadCompanyCatalogProducts(companyId) : [];
  const merged = mergeCatalogProducts(LOCAL_CATALOG, companyProducts);
  return localCatalogForCategory(category, merged);
}

function parseCategory(raw?: string): "serrurerie" | "autre" | undefined {
  if (raw === "serrurerie" || raw === "autre") return raw;
  return undefined;
}

function localCatalogForCategory(category: string | undefined, base: typeof LOCAL_CATALOG) {
  const cat = parseCategory(category);
  if (!cat) return base;
  return filterCatalogForIntervention(base, {
    category: cat,
    problem: "",
  });
}

/**
 * GET ?q=&category= — recherche produits Lecot (API externe si LECOT_API_URL, sinon catalogue local).
 */
export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || undefined;
  const companyId = searchParams.get("companyId")?.trim() || undefined;
  const local = await catalogForCompany(companyId, category);

  if (q.length < 2) {
    return NextResponse.json({
      products: local.slice(0, 6),
      source: "local" as const,
      configured: Boolean(lecotApiBaseUrl()),
    });
  }

  const remote = await searchLecotViaApi(q);
  if (remote && remote.length > 0) {
    return NextResponse.json({
      products: remote.slice(0, 12),
      source: "api" as const,
      configured: true,
    });
  }

  return NextResponse.json({
    products: searchCatalogProducts(local, q, 12),
    source: remote === null ? ("local" as const) : ("local_fallback" as const),
    configured: Boolean(lecotApiBaseUrl()),
  });
}
