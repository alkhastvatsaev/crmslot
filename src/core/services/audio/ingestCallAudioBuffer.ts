import fs from "fs";
import path from "path";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import type { PendingUploadJob } from "@/core/services/audio/process-upload-jobs";
import { runProcessUploadJob } from "@/core/services/audio/run-process-upload-job";
import type { AudioUploadSidecar } from "@/core/services/audio/transcription.types";
import { logger } from "@/core/logger";

export type IngestCallAudioParams = {
  buffer: Buffer;
  /** Extension avec point (ex. `.wav`). */
  ext?: string;
  phone?: string | null;
  source: AudioUploadSidecar["source"];
  /** Préfixe fichier sans extension (optionnel). */
  fileBase?: string;
};

export type IngestCallAudioResult = {
  publicUrl: string;
  rootRel: string;
  job: PendingUploadJob;
};

/**
 * Enregistre un buffer audio dans `public/uploads`, met à jour `ai_status/macrodroid`,
 * et lance la transcription en arrière-plan.
 */
export async function ingestCallAudioBuffer(
  params: IngestCallAudioParams
): Promise<IngestCallAudioResult> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const ext = params.ext?.startsWith(".") ? params.ext : `.${params.ext || "wav"}`;
  const phoneSegment = params.phone?.replace(/[^a-zA-Z0-9]/g, "") || "unknown";
  const safeBase =
    params.fileBase?.replace(/[^a-zA-Z0-9_-]/g, "") ||
    `call-${phoneSegment}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const rootRel = `${safeBase}${ext}`;
  const savedPath = path.join(uploadsDir, rootRel);
  fs.writeFileSync(savedPath, params.buffer);

  const publicUrl = `/uploads/${rootRel}`;
  const receivedAt = new Date().toISOString();

  try {
    if (admin.apps.length) {
      const db = admin.firestore();
      const dispPhone = params.phone?.trim() ? params.phone.trim() : null;
      await db.collection("ai_status").doc("macrodroid").set(
        {
          status: "processing",
          transcript: "",
          phone: dispPhone,
          audioUrl: publicUrl,
          updatedAt: receivedAt,
        },
        { merge: true }
      );
    }
  } catch (e) {
    logger.warn("[ingestCallAudioBuffer] Firestore:", {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  const stem = path.basename(rootRel, path.extname(rootRel));
  const job: PendingUploadJob = {
    stem,
    canonical: rootRel,
    mtimeMs: fs.statSync(savedPath).mtimeMs,
  };

  void runProcessUploadJob({
    uploadsDir,
    job,
    source: params.source,
    dispatchPhone: params.phone ?? null,
  }).catch((err) =>
    logger.error("[ingestCallAudioBuffer] Traitement async:", {
      error: err instanceof Error ? err.message : String(err),
    })
  );

  return { publicUrl, rootRel, job };
}
