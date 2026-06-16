import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, isConfigured, storage } from "@/core/config/firebase";
import { logger } from "@/core/logger";

async function ensureUserForAudioUpload() {
  if (!isConfigured || !auth) return null;
  return auth.currentUser;
}

function extFromBlob(blob: Blob): string {
  const mime = blob.type || "audio/webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  return "webm";
}

/** Upload vocal vers Firebase Storage. */
export async function uploadInterventionAudioToFirebase(blob: Blob): Promise<{
  url: string;
  storagePath: string;
  mime: string;
} | null> {
  if (!storage) return null;
  try {
    const user = await ensureUserForAudioUpload();
    if (!user) return null;
    const mime = blob.type || "audio/webm";
    const ext = extFromBlob(blob);
    const storagePath = `interventions_audio/${user.uid}/${Date.now()}.${ext}`;
    const r = ref(storage, storagePath);
    await uploadBytes(r, blob, { contentType: mime });
    const url = await getDownloadURL(r);
    return { url, storagePath, mime };
  } catch (e) {
    logger.error("[uploadInterventionAudioToFirebase]", {
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

/** URLs audio persistables en intervention (HTTPS ou data URI courte). */
export function isPersistableClientAudioUrl(url: string | null | undefined): boolean {
  const u = (url ?? "").trim();
  if (!u) return false;
  if (u.startsWith("https://") || u.startsWith("http://")) return true;
  if (u.startsWith("data:")) return u.length < 980_000;
  return false;
}
