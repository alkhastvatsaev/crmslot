import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import {
  resolveLecotProductImagesBatch,
  type LecotImageLookupInput,
} from "@/features/catalog/resolveLecotProductImage";

export const runtime = "nodejs";

type Body = {
  items?: Array<{
    reference?: string;
    description?: string;
    imageUrl?: string | null;
    lecotSku?: string | null;
  }>;
};

function parseItems(body: Body): LecotImageLookupInput[] {
  if (!Array.isArray(body.items)) return [];
  return body.items
    .map((row) => ({
      reference: String(row.reference ?? "").trim(),
      description: row.description?.trim() || undefined,
      imageUrl: row.imageUrl ?? undefined,
      lecotSku: row.lecotSku ?? undefined,
    }))
    .filter((row) => row.reference.length > 0);
}

/**
 * POST { items: [{ reference, description?, imageUrl? }] }
 * → { images: Record<reference, string | null> }
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = parseItems(body);
  if (items.length === 0) {
    return NextResponse.json({ images: {} as Record<string, string | null> });
  }

  const images = await resolveLecotProductImagesBatch(items);
  return NextResponse.json({ images });
}
