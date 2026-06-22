"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { base64ToBlobUrl, revokeBlobUrl } from "@/features/gmail/gmailHubAttachmentBlob";
import type { GmailHubAttachment } from "@/features/gmail/gmailHubTypes";

type LoadAttachmentFn = (
  messageId: string,
  att: GmailHubAttachment
) => Promise<{ dataBase64: string; mimeType?: string }>;

type Options = {
  selectedId: string | null;
  selectedMessageId: string | undefined;
  loadAttachment: LoadAttachmentFn;
  attachmentErrorLabel: string;
};

export function useGmailHubPdfPreview({
  selectedId,
  selectedMessageId,
  loadAttachment,
  attachmentErrorLabel,
}: Options) {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewAttachmentId, setPdfPreviewAttachmentId] = useState<string | null>(null);
  const [pdfPreviewLoadingId, setPdfPreviewLoadingId] = useState<string | null>(null);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);

  const pdfPreviewUrlOwnedRef = useRef(true);

  const closePdfPreview = useCallback(() => {
    setPdfPreviewUrl((prev) => {
      if (pdfPreviewUrlOwnedRef.current) revokeBlobUrl(prev);
      pdfPreviewUrlOwnedRef.current = true;
      return null;
    });
    setPdfPreviewAttachmentId(null);
    setPdfPreviewLoadingId(null);
    setPdfPreviewError(null);
  }, []);

  useEffect(() => {
    closePdfPreview();
  }, [selectedId, closePdfPreview]);

  const handleOpenPdf = useCallback(
    async (att: GmailHubAttachment, cachedPreview?: { blobUrl: string } | null) => {
      const messageId = selectedMessageId;
      if (!messageId) return;
      setPdfPreviewLoadingId(att.attachmentId);
      setPdfPreviewError(null);
      setPdfPreviewUrl((prev) => {
        if (pdfPreviewUrlOwnedRef.current) revokeBlobUrl(prev);
        return null;
      });
      setPdfPreviewAttachmentId(null);
      try {
        if (cachedPreview?.blobUrl) {
          pdfPreviewUrlOwnedRef.current = false;
          setPdfPreviewUrl(cachedPreview.blobUrl);
          setPdfPreviewAttachmentId(att.attachmentId);
          return;
        }
        const data = await loadAttachment(messageId, att);
        const url = base64ToBlobUrl(data.dataBase64, data.mimeType || "application/pdf");
        pdfPreviewUrlOwnedRef.current = true;
        setPdfPreviewUrl(url);
        setPdfPreviewAttachmentId(att.attachmentId);
      } catch (e) {
        setPdfPreviewError(e instanceof Error ? e.message : attachmentErrorLabel);
        setPdfPreviewAttachmentId(att.attachmentId);
      } finally {
        setPdfPreviewLoadingId(null);
      }
    },
    [selectedMessageId, loadAttachment, attachmentErrorLabel]
  );

  return {
    pdfPreviewUrl,
    pdfPreviewAttachmentId,
    pdfPreviewLoadingId,
    pdfPreviewError,
    closePdfPreview,
    handleOpenPdf,
  };
}
