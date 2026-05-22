"use client";

let workerReady: Promise<typeof import("pdfjs-dist")> | null = null;

/** pdf.js (worker) — évite la barre native Safari sur les iframes PDF. */
export async function getPdfJs() {
  if (!workerReady) {
    workerReady = (async () => {
      const pdfjs = await import("pdfjs-dist");
      if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
      }
      return pdfjs;
    })();
  }
  return workerReady;
}

export function base64ToUint8Array(dataBase64: string): Uint8Array {
  const binary = atob(dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
