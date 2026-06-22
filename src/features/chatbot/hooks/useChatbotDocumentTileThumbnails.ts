"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { documentPdfApiPath, supplierOrderPdfApiPath } from "@/features/chatbot/chatbot-document";
import { getPdfFromCache, savePdfToCache } from "@/features/chatbot/chatbotPdfDb";
import { renderPdfBlobFirstPageThumbnail } from "@/features/gmail/renderPdfThumbnail";

const MAX_TILE_THUMBNAILS = 16;
const THUMBNAIL_CONCURRENCY = 4;
const THUMBNAIL_MAX_WIDTH_PX = 176;

export type ChatbotDocTilePreview = {
  thumbnailUrl: string;
};

const thumbnailMemoryCache = new Map<string, string>();

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
  return renderPdfBlobFirstPageThumbnail(blob, THUMBNAIL_MAX_WIDTH_PX);
}

async function loadSupplierOrderThumbnail(
  companyId: string,
  orderId: string
): Promise<string | null> {
  let blob = await getPdfFromCache("", "material_order", companyId, orderId);
  if (!blob) {
    const res = await fetchWithAuth(supplierOrderPdfApiPath(companyId, orderId));
    if (!res.ok) return null;
    blob = await res.blob();
    await savePdfToCache("", "material_order", blob, companyId, orderId);
  }
  return renderPdfBlobFirstPageThumbnail(blob, THUMBNAIL_MAX_WIDTH_PX);
}

type ThumbnailTask = {
  key: string;
  run: () => Promise<string | null>;
};

async function runThumbnailTasksWithConcurrency(
  tasks: ThumbnailTask[],
  concurrency: number,
  onResult: (key: string, thumbnailUrl: string | null) => void
): Promise<void> {
  if (tasks.length === 0) return;

  let cursor = 0;
  const workerCount = Math.min(concurrency, tasks.length);

  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor];
      cursor += 1;
      if (!task) continue;

      const cached = thumbnailMemoryCache.get(task.key);
      if (cached) {
        onResult(task.key, cached);
        continue;
      }

      try {
        const thumbnailUrl = await task.run();
        if (thumbnailUrl) {
          thumbnailMemoryCache.set(task.key, thumbnailUrl);
        }
        onResult(task.key, thumbnailUrl);
      } catch {
        onResult(task.key, null);
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

function seedThumbnailsFromCache(keys: string[]): Record<string, ChatbotDocTilePreview> {
  const seeded: Record<string, ChatbotDocTilePreview> = {};
  for (const key of keys) {
    const thumbnailUrl = thumbnailMemoryCache.get(key);
    if (thumbnailUrl) seeded[key] = { thumbnailUrl };
  }
  return seeded;
}

/** Miniatures pdf.js pour les tuiles du panneau Documents (clic → iframe natif). */
export function useChatbotDocumentTileThumbnails(
  companyId: string | null,
  invoiceIds: string[],
  orderIds: string[],
  enabled = true
) {
  const [thumbnails, setThumbnails] = useState<Record<string, ChatbotDocTilePreview>>({});
  const [thumbnailLoading, setThumbnailLoading] = useState<Record<string, boolean>>({});

  const loadKey = useMemo(() => {
    const inv = invoiceIds.slice(0, MAX_TILE_THUMBNAILS).join(",");
    const ord = orderIds.slice(0, MAX_TILE_THUMBNAILS).join(",");
    return `${companyId ?? ""}|${inv}|${ord}`;
  }, [companyId, invoiceIds, orderIds]);

  useEffect(() => {
    if (!enabled) {
      setThumbnails({});
      setThumbnailLoading({});
      return;
    }

    let cancelled = false;

    const invTargets = invoiceIds.slice(0, MAX_TILE_THUMBNAILS);
    const ordTargets = orderIds.slice(0, MAX_TILE_THUMBNAILS);
    const targetKeys = [
      ...invTargets.map((id) => invoiceTileKey(id)),
      ...ordTargets.map((id) => supplierTileKey(id)),
    ];

    const seeded = seedThumbnailsFromCache(targetKeys);
    setThumbnails(seeded);
    setThumbnailLoading({});

    const pendingKeys = targetKeys.filter((key) => !seeded[key]);
    if (pendingKeys.length === 0) return;

    const loadingState = Object.fromEntries(pendingKeys.map((key) => [key, true]));
    setThumbnailLoading(loadingState);

    const tasks: ThumbnailTask[] = [
      ...invTargets
        .map((interventionId) => ({
          key: invoiceTileKey(interventionId),
          run: () => loadInvoiceThumbnail(interventionId),
        }))
        .filter((task) => pendingKeys.includes(task.key)),
      ...(companyId
        ? ordTargets.map((orderId) => ({
            key: supplierTileKey(orderId),
            run: () => loadSupplierOrderThumbnail(companyId, orderId),
          }))
        : []
      ).filter((task) => pendingKeys.includes(task.key)),
    ];

    void (async () => {
      await runThumbnailTasksWithConcurrency(tasks, THUMBNAIL_CONCURRENCY, (key, thumbnailUrl) => {
        if (cancelled) return;
        if (thumbnailUrl) {
          setThumbnails((prev) => ({ ...prev, [key]: { thumbnailUrl } }));
        }
        setThumbnailLoading((prev) => {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        });
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, loadKey, companyId, invoiceIds, orderIds]);

  return { thumbnails, thumbnailLoading };
}
