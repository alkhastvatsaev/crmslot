import { lecotApiBaseUrl } from "@/features/catalog/lecotApiSearch";
import { lecotPlaywrightOrderEnabled } from "@/features/catalog/lecotOrderFlags";
import {
  placeOrderViaPlaywright,
  type LecotGuestInfo,
} from "@/features/catalog/lecotPlaywrightScraper";
import { loadLecotGuestInfo } from "@/features/catalog/lecotGuestInfoFromFirestore";
import type { SupplierOrderLine } from "@/features/suppliers";

export type LecotSupplierOrderResult =
  | { ok: true; source: "api"; orderId?: string }
  | { ok: true; source: "playwright"; orderId?: string }
  | { ok: true; source: "manual"; message: string; lines: SupplierOrderLine[] }
  | { ok: false; error: string };

/**
 * Envoie une commande Lecot :
 *  1. API Lecot si LECOT_API_URL configuré
 *  2. Playwright (scraping lecot.be) avec checkout invité
 *  3. Brouillon CRMSLOT (fallback)
 */
export async function submitLecotSupplierOrder(params: {
  lines: SupplierOrderLine[];
  notes?: string | null;
  companyId?: string;
}): Promise<LecotSupplierOrderResult> {
  const lines = params.lines;
  if (!lines.length) {
    return { ok: false, error: "Aucune ligne de commande" };
  }

  // ── 1. API Lecot ────────────────────────────────────────────────────────────
  const lecotBase = lecotApiBaseUrl();
  if (lecotBase) {
    try {
      const orderUrl = new URL("/orders", lecotBase.endsWith("/") ? lecotBase : `${lecotBase}/`);
      const apiKey = process.env.LECOT_API_KEY?.trim() || process.env.LECOT_API_TOKEN?.trim();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(orderUrl.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify({ lines, notes: params.notes ?? undefined }),
      });

      if (!res.ok) return { ok: false, error: `API Lecot : HTTP ${res.status}` };

      const data = (await res.json().catch(() => null)) as { orderId?: string } | null;
      return { ok: true, source: "api", orderId: data?.orderId };
    } catch {
      return { ok: false, error: "Impossible de joindre l'API Lecot" };
    }
  }

  // ── 2. Playwright (opt-in : LECOT_PLAYWRIGHT_ORDER=true) — très lent ────────
  if (lecotPlaywrightOrderEnabled()) {
    try {
      const guestInfo = params.companyId
        ? await loadLecotGuestInfo(params.companyId).catch(() => null)
        : null;
      const result = await placeOrderViaPlaywright(lines, guestInfo ?? ({} as LecotGuestInfo));
      if (result.ok && result.source === "playwright_cart_ready") {
        return { ok: true, source: "manual", message: result.message, lines };
      }
      if (result.ok && result.source === "playwright") {
        return { ok: true, source: "playwright", orderId: result.orderId };
      }
    } catch {
      // Playwright unavailable or crashed → fallback draft
    }
  }

  // ── 3. Brouillon CRMSLOT ────────────────────────────────────────────────────
  return {
    ok: true,
    source: "manual",
    message:
      "Commande enregistrée dans CRMSLOT en brouillon. Finalisez sur lecot.be ou configurez LECOT_CONTACT_EMAIL + LECOT_CONTACT_PHONE pour activer le passage automatique.",
    lines,
  };
}
