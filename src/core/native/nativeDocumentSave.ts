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

/**
 * Dépendances injectables — patron testable pour bridges Capacitor.
 * Le code de prod fournit les vraies imports Capacitor / DOM ; les tests passent des stubs.
 */
export type SaveOrShareDeps = {
  isNative: () => boolean;
  loadFilesystem: () => Promise<{
    Filesystem: {
      writeFile: (opts: {
        path: string;
        data: string;
        directory: unknown;
        recursive?: boolean;
      }) => Promise<{ uri: string }>;
    };
    Directory: { Documents: unknown };
  }>;
  loadShare: () => Promise<{
    Share: {
      share: (opts: { title: string; url: string; dialogTitle?: string }) => Promise<unknown>;
    };
  }>;
  /** Triggers le téléchargement Blob côté web (override pour test). */
  webDownload?: (input: SaveDocumentInput) => SaveDocumentResult;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function defaultWebDownload(input: SaveDocumentInput): SaveDocumentResult {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return { ok: false, reason: "no-browser-context" };
  }
  try {
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
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

const PROD_DEPS: SaveOrShareDeps = {
  isNative: isCapacitorNative,
  loadFilesystem: async () =>
    (await import("@capacitor/filesystem")) as unknown as Awaited<
      ReturnType<SaveOrShareDeps["loadFilesystem"]>
    >,
  loadShare: async () =>
    (await import("@capacitor/share")) as unknown as Awaited<
      ReturnType<SaveOrShareDeps["loadShare"]>
    >,
};

/**
 * Sauve un binaire (PDF/image) localement et propose le partage.
 * - Capacitor : Filesystem Documents → Share sheet
 * - Web : déclenche un téléchargement Blob standard.
 */
export async function saveOrShareDocument(
  input: SaveDocumentInput,
  deps: SaveOrShareDeps = PROD_DEPS
): Promise<SaveDocumentResult> {
  const wantShare = input.share !== false;

  if (deps.isNative()) {
    try {
      const { Filesystem, Directory } = await deps.loadFilesystem();
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
          const { Share } = await deps.loadShare();
          await Share.share({
            title: input.shareTitle ?? input.filename,
            url: path,
            dialogTitle: input.shareTitle ?? input.filename,
          });
          shared = true;
        } catch (shareErr) {
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
    }
  }

  return (deps.webDownload ?? defaultWebDownload)(input);
}
