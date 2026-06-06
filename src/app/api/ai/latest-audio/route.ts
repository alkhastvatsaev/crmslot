import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import {
  readAudioUploadSidecarIfPresent,
  readTranscriptSidecarIfPresent,
} from "@/core/services/audio/transcript-sidecar";
import { readAudioDecisionForUpload } from "@/core/services/audio/audio-route-helpers";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      return NextResponse.json({ audio: null, decision: { status: "none", updatedAt: null } });
    }

    const walk = (dirAbs: string, dirRel: string): string[] => {
      const out: string[] = [];
      const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const abs = path.join(dirAbs, e.name);
        const rel = dirRel ? path.posix.join(dirRel, e.name) : e.name;
        if (e.isDirectory()) out.push(...walk(abs, rel));
        else out.push(rel);
      }
      return out;
    };
    const files = walk(uploadsDir, "");
    const audios = files
      .filter((file) => {
        const lower = file.toLowerCase();
        return (
          lower.endsWith(".amr") ||
          lower.endsWith(".wav") ||
          lower.endsWith(".mp3") ||
          lower.endsWith(".m4a")
        );
      })
      .map((file) => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        const transcript = readTranscriptSidecarIfPresent(file);
        const meta = readAudioUploadSidecarIfPresent(file);
        return {
          name: file,
          url: `/uploads/${file}`,
          createdAt: stats.mtime.toISOString(),
          size: stats.size,
          transcript,
          meta: meta ?? undefined,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const audio = audios[0] ?? null;
    if (!audio) {
      return NextResponse.json({ audio: null, decision: { status: "none", updatedAt: null } });
    }

    const decision = await readAudioDecisionForUpload(audio.name);
    return NextResponse.json({ audio, decision });
  } catch (error) {
    logger.error("[latest-audio] error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Impossible de lire le dossier" }, { status: 500 });
  }
}
