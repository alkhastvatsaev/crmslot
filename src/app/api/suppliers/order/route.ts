import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { submitLecotSupplierOrder } from "@/features/catalog/lecotSupplierOrder";
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

  if (body.supplierId === "lecot") {
    const result = await submitLecotSupplierOrder({ lines, notes: body.notes });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    if (result.source === "manual") {
      return NextResponse.json({ ok: true, source: "manual", message: result.message, lines: result.lines });
    }
    return NextResponse.json({ ok: true, source: result.source, orderId: result.orderId });
  }

  return NextResponse.json({
    ok: true,
    source: "manual",
    message: "Fournisseur non pris en charge par l'API — traitement manuel.",
    lines,
  });
}
