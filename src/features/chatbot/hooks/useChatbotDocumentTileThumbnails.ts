"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  documentPdfApiPath,
  supplierOrderPdfApiPath,
} from "@/features/chatbot/chatbot-document";
import { getPdfFromCache, savePdfToCache } from "@/features/chatbot/chatbotPdfDb";
import { renderPdfBlobFirstPageThumbnail } from "@/features/gmail/renderPdfThumbnail";

const MAX_TILE_THUMBNAILS = 16;

export type ChatbotDocTilePreview = {
  thumbnailUrl: string;
};

export function invoiceTileKey(interventionId: string): string {
  return `invoice:${interventionId}`;
}

export function supplierTileKey(orderId: string): string {
  return `supplier:${orderId}`;
}

async function loadInvoiceThumbnail(interventionId: string): Promise<string | null> {
  let blob = await getPdfFromCache(interventionId, "invoice");
  if (!blob) {
    const res = await fetchWithAuth(documentPdfApiPath(interventionId, "invoice"));
    if (!res.ok) return null;
    blob = await res.blob();
    await savePdfToCache(interventionId, "invoice", blob);
  }
  return renderPdfBlobFirstPageThumbnail(blob);
}

async function loadSupplierOrderThumbnail(
  companyId: string,
  orderId: string,
): Promise<string | null> {
  let blob = await getPdfFromCache("", "material_order", companyId, orderId);
  if (!blob) {
    const res = await fetchWithAuth(supplierOrderPdfApiPath(companyId, orderId));
    if (!res.ok) return null;
    blob = await res.blob();
    await savePdfToCache("", "material_order", blob, companyId, orderId);
  }
  return renderPdfBlobFirstPageThumbnail(blob);
}

/** Miniatures pdf.js pour les tuiles du panneau Documents (clic → iframe natif). */
export function useChatbotDocumentTileThumbnails(
  companyId: string | null,
  invoiceIds: string[],
  orderIds: string[],
) {
  const [thumbnails, setThumbnails] = useState<Record<string, ChatbotDocTilePreview>>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<Record<string, boolean>>({});

  const loadKey = useMemo(() => {
    const inv = invoiceIds.slice(0, MAX_TILE_THUMBNAILS).join(",");
    const ord = orderIds.slice(0, MAX_TILE_THUMBNAILS).join(",");
    return `${companyId ?? ""}|${inv}|${ord}`;
  }, [companyId, invoiceIds, orderIds]);

  useEffect(() => {
    let cancelled = false;
    setThumbnails({});
    setThumbnailLoading({});

    const invTargets = invoiceIds.slice(0, MAX_TILE_THUMBNAILS);
    const ordTargets = orderIds.slice(0, MAX_TILE_THUMBNAILS);
    if (invTargets.length === 0 && ordTargets.length === 0) return;

    void (async () => {
      for (const interventionId of invTargets) {
        if (cancelled) return;
        const key = invoiceTileKey(interventionId);
        setThumbnailLoading((prev) => ({ ...prev, [key]: true }));
        try {
          const thumbnailUrl = await loadInvoiceThumbnail(interventionId);
          if (!cancelled && thumbnailUrl) {
            setThumbnails((prev) => ({ ...prev, [key]: { thumbnailUrl } }));
          }
        } catch {
          /* icône de repli */
        } finally {
          if (!cancelled) {
            setThumbnailLoading((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }
        }
      }

      if (!companyId) return;

      for (const orderId of ordTargets) {
        if (cancelled) return;
        const key = supplierTileKey(orderId);
        setThumbnailLoading((prev) => ({ ...prev, [key]: true }));
        try {
          const thumbnailUrl = await loadSupplierOrderThumbnail(companyId, orderId);
          if (!cancelled && thumbnailUrl) {
            setThumbnails((prev) => ({ ...prev, [key]: { thumbnailUrl } }));
          }
        } catch {
          /* icône de repli */
        } finally {
          if (!cancelled) {
            setThumbnailLoading((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadKey, companyId, invoiceIds, orderIds]);

  return { thumbnails, thumbnailLoading };
}
