import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { blockIfProduction, requireAuthenticatedUser } from "@/core/api/routeAuth";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

function getDemoAudioAbsDir() {
  const isDev = process.env.NODE_ENV !== "production";
  return isDev
    ? path.join(process.cwd(), ".demo-data", "client-audios")
    : path.join(process.cwd(), "public", "client-audios");
}

function inferContentType(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const blocked = blockIfProduction();
  if (blocked) return blocked;
  const auth = await requireAuthenticatedUser(req);
  if ("response" in auth) return auth.response;

  try {
    const { name } = await params;
    // prevent path traversal
    const safeName = path.basename(name);
    const absPath = path.join(getDemoAudioAbsDir(), safeName);
    const buf = await readFile(absPath);

    return new NextResponse(buf, {
      headers: {
        "Content-Type": inferContentType(safeName),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    logger.error("Audio not found", { error: e instanceof Error ? e.message : String(e) });
    return NextResponse.json({ error: "Audio not found" }, { status: 404 });
  }
}
