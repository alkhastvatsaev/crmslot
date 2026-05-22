"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GmailHubAttachment } from "@/features/gmail/gmailHubTypes";
import { base64ToBlobUrl, revokeBlobUrl } from "@/features/gmail/gmailHubAttachmentBlob";
import { renderPdfFirstPageThumbnail } from "@/features/gmail/renderPdfThumbnail";

export type GmailLoadAttachmentResult = {
  dataBase64: string;
  mimeType: string;
  filename: string;
};

export type GmailLoadAttachmentFn = (
  messageId: string,
  attachment: GmailHubAttachment,
) => Promise<GmailLoadAttachmentResult>;

export type GmailPdfAttachmentPreview = {
  /** Image JPEG (pdf.js) — pas de barre Safari */
  thumbnailUrl: string;
  /** Blob pour le panneau plein écran */
  blobUrl: string;
};

function isPdf(att: GmailHubAttachment): boolean {
  if (att.mimeType.includes("pdf")) return true;
  return att.filename.toLowerCase().endsWith(".pdf");
}

const MAX_THUMBNAIL_PDFS = 6;

/** Charge miniatures (canvas) + blobs pour les tuiles PDF Gmail. */
export function useGmailPdfAttachmentPreviews(
  messageId: string | undefined,
  attachments: GmailHubAttachment[],
  loadAttachment: GmailLoadAttachmentFn | undefined,
) {
  const [previews, setPreviews] = useState<Record<string, GmailPdfAttachmentPreview>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});
  const blobsRef = useRef<Record<string, string>>({});

  const pdfAttachmentKey = useMemo(
    () =>
      attachments
        .filter(isPdf)
        .slice(0, MAX_THUMBNAIL_PDFS)
        .map((a) => `${a.attachmentId}:${a.size}`)
        .join("|"),
    [attachments],
  );

  useEffect(() => {
    const revokeAll = () => {
      Object.values(blobsRef.current).forEach((url) => revokeBlobUrl(url));
      blobsRef.current = {};
      setPreviews({});
      setLoadingIds({});
    };

    if (!messageId || !loadAttachment) {
      revokeAll();
      return revokeAll;
    }

    const pdfs = attachments.filter(isPdf).slice(0, MAX_THUMBNAIL_PDFS);
    revokeAll();

    if (pdfs.length === 0) return revokeAll;

    let cancelled = false;

    void (async () => {
      for (const att of pdfs) {
        if (cancelled) return;
        setLoadingIds((prev) => ({ ...prev, [att.attachmentId]: true }));
        try {
          const data = await loadAttachment(messageId, att);
          if (cancelled) return;
          const blobUrl = base64ToBlobUrl(data.dataBase64, data.mimeType || "application/pdf");
          blobsRef.current[att.attachmentId] = blobUrl;
          const thumbnailUrl =
            (await renderPdfFirstPageThumbnail(data.dataBase64, 264)) ?? null;
          if (cancelled) return;
          if (thumbnailUrl) {
            setPreviews((prev) => ({
              ...prev,
              [att.attachmentId]: { thumbnailUrl, blobUrl },
            }));
          }
        } catch {
          /* icône de repli */
        } finally {
          if (!cancelled) {
            setLoadingIds((prev) => {
              const next = { ...prev };
              delete next[att.attachmentId];
              return next;
            });
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      revokeAll();
    };
  }, [messageId, pdfAttachmentKey, loadAttachment]);

  return { previews, thumbnailLoading: loadingIds };
}
