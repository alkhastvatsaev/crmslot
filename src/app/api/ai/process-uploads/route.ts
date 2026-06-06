import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import "@/core/config/firebase-admin";
import { authorizeProcessUploads } from "@/core/api/routeAuth";
import { findPendingUploadJobs } from "@/core/services/audio/process-upload-jobs";
import { runProcessUploadJob } from "@/core/services/audio/run-process-upload-job";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

/** Limite serveur (Vercel Pro+) — ajuste si besoin */
export const maxDuration = 120;

/**
 * Traite au plus un fichier audio dans `public/uploads` sans `.audio.json` à jour.
 * Sécurité en prod : jeton Firebase, secret `UPLOAD_AUTO_PROCESS_SECRET`, ou IP bureau + `OFFICE_ALLOW_UPLOAD_AUTO_PROCESS`.
 */
export async function POST(request: Request) {
  try {
    const ok = await authorizeProcessUploads(request);
    if (!ok) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });

    const pending = findPendingUploadJobs(uploadsDir);

    if (!pending.length) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "Aucun fichier à traiter",
        pending: 0,
      });
    }

    const job = pending[0];
    const out = await runProcessUploadJob({ uploadsDir, job, source: "upload-auto" });

    return NextResponse.json({
      success: true,
      processed: 1,
      file: job.canonical,
      stem: job.stem,
      pendingAfter: Math.max(0, pending.length - 1),
      data: out.analysis,
      rawTranscript: out.rawTranscript,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    logger.error("[process-uploads] Erreur globale:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/** GET — sonde légère (nombre de jobs en attente), mêmes règles d’auth */
export async function GET(request: Request) {
  const ok = await authorizeProcessUploads(request);
  if (!ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  const pending = findPendingUploadJobs(uploadsDir);
  return NextResponse.json({ success: true, pending: pending.length });
}
