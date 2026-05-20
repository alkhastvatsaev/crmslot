import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { lecotApiBaseUrl } from "@/features/catalog/lecotApiSearch";
import type { SupplierOrderLine } from "@/features/suppliers/types";

export const runtime = "nodejs";

/**
 * POST /api/suppliers/order
 * Body: { supplierId, lines: SupplierOrderLine[], notes? }
 *
 * Envoie la commande à l'API fournisseur (Lecot si configuré) ou retourne les lignes
 * pour traitement manuel.
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: { supplierId?: string; lines?: SupplierOrderLine[]; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const lines = body.lines;
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ ok: false, error: "No order lines provided" }, { status: 400 });
  }

  const lecotBase = lecotApiBaseUrl();

  if (lecotBase && body.supplierId === "lecot") {
    try {
      const orderUrl = new URL("/orders", lecotBase.endsWith("/") ? lecotBase : `${lecotBase}/`);
      const apiKey = process.env.LECOT_API_KEY?.trim() || process.env.LECOT_API_TOKEN?.trim();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(orderUrl.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify({ lines, notes: body.notes }),
      });

      if (!res.ok) {
        return NextResponse.json({ ok: false, error: `Lecot API returned ${res.status}` }, { status: 502 });
      }

      const data = (await res.json().catch(() => null)) as { orderId?: string } | null;
      return NextResponse.json({ ok: true, source: "api", orderId: data?.orderId });
    } catch {
      return NextResponse.json({ ok: false, error: "Failed to reach Lecot API" }, { status: 502 });
    }
  }

  // No external API — return order for manual processing
  return NextResponse.json({
    ok: true,
    source: "manual",
    message: "Commande enregistrée. Envoi manuel requis (API fournisseur non configurée).",
    lines,
  });
}
