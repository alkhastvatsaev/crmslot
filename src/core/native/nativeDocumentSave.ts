import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { logger } from "@/core/logger";

export type DocumentMimeType = "application/pdf" | "image/png" | "image/jpeg";

export type SaveDocumentInput = {
  /** Nom de fichier final (avec extension). */
  filename: string;
  /** Contenu binaire (PDF, image, etc.). */
  bytes: Uint8Array;
  mimeType: DocumentMimeType;
  /** Titre affiché dans la sheet de partage (Capacitor). */
  shareTitle?: string;
  /** Si true (default), ouvre la sheet de partage native après sauvegarde. */
  share?: boolean;
};

export type SaveDocumentResult =
  | { ok: true; via: "capacitor"; path: string; uri: string; shared: boolean }
  | { ok: true; via: "web-download" }
  | { ok: false; reason: string };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Sauve un binaire (PDF/image) localement et propose le partage.
 * - Capacitor : Filesystem Documents → Share sheet (mail / WhatsApp / Drive…)
 * - Web : déclenche un téléchargement Blob standard.
 */
export async function saveOrShareDocument(input: SaveDocumentInput): Promise<SaveDocumentResult> {
  const wantShare = input.share !== false;

  if (isCapacitorNative()) {
    try {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      void Encoding;

      const writeResult = await Filesystem.writeFile({
        path: input.filename,
        data: bytesToBase64(input.bytes),
        directory: Directory.Documents,
        recursive: true,
      });

      const path = writeResult.uri;

      let shared = false;
      if (wantShare) {
        try {
          const { Share } = await import("@capacitor/share");
          await Share.share({
            title: input.shareTitle ?? input.filename,
            url: path,
            dialogTitle: input.shareTitle ?? input.filename,
          });
          shared = true;
        } catch (shareErr) {
          // L'utilisateur a peut-être annulé — le fichier reste écrit.
          logger.warn("[saveOrShareDocument] share canceled", {
            error: shareErr instanceof Error ? shareErr.message : String(shareErr),
          });
        }
      }

      return { ok: true, via: "capacitor", path, uri: path, shared };
    } catch (err) {
      logger.warn("[saveOrShareDocument] capacitor write failed, falling back to web", {
        error: err instanceof Error ? err.message : String(err),
      });
      // fall through to web path
    }
  }

  if (typeof document === "undefined" || typeof URL === "undefined") {
    return { ok: false, reason: "no-browser-context" };
  }

  try {
    // Copie le buffer dans un ArrayBuffer propre — évite les warnings Blob/SharedArrayBuffer.
    const buffer = new ArrayBuffer(input.bytes.byteLength);
    new Uint8Array(buffer).set(input.bytes);
    const blob = new Blob([buffer], { type: input.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = input.filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
    return { ok: true, via: "web-download" };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
