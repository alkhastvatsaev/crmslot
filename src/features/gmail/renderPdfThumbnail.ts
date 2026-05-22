"use client";

import { base64ToUint8Array, getPdfJs } from "@/features/gmail/pdfJsClient";

/** Rend les pages PDF en images JPEG (pas de viewer natif macOS/Safari). */
export async function renderPdfPagesToDataUrls(
  pdfBytes: Uint8Array,
  maxWidthPx: number,
): Promise<string[]> {
  const pdfjs = await getPdfJs();
  const doc = await pdfjs.getDocument({ data: pdfBytes }).promise;
  const pages: string[] = [];

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = maxWidthPx / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      pages.push(canvas.toDataURL("image/jpeg", 0.9));
    }
  } finally {
    await doc.destroy();
  }

  return pages;
}

export async function renderPdfFirstPageThumbnail(
  dataBase64: string,
  maxWidthPx = 264,
): Promise<string | null> {
  try {
    const pages = await renderPdfPagesToDataUrls(base64ToUint8Array(dataBase64), maxWidthPx);
    return pages[0] ?? null;
  } catch {
    return null;
  }
}

/** Première page d’un Blob PDF → JPEG (miniatures tuiles, sans UI Safari). */
export async function renderPdfBlobFirstPageThumbnail(
  blob: Blob,
  maxWidthPx = 264,
): Promise<string | null> {
  try {
    const buf = new Uint8Array(await blob.arrayBuffer());
    const pages = await renderPdfPagesToDataUrls(buf, maxWidthPx);
    return pages[0] ?? null;
  } catch {
    return null;
  }
}
