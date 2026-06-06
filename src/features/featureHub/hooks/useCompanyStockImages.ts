"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";
import type { StockItem } from "@/features/materials/stockFirestore";

export type StockImageMap = Record<string, string | null>;

type Options = {
  enabled?: boolean;
};

/**
 * Charge les vignettes Lecot pour les articles visibles (batch API + cache serveur).
 * Clé = `StockItem.id`.
 */
export function useCompanyStockImages(items: StockItem[], options?: Options): StockImageMap {
  const enabled = options?.enabled ?? true;
  const [images, setImages] = useState<StockImageMap>({});

  const payloadKey = useMemo(
    () =>
      items
        .map(
          (item) =>
            `${item.id}|${item.reference}|${item.description}|${item.imageUrl ?? ""}|${item.lecotSku ?? ""}`
        )
        .join("\n"),
    [items]
  );

  useEffect(() => {
    if (!enabled || items.length === 0) {
      setImages({});
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const withDirect = items.reduce<StockImageMap>((acc, item) => {
          const direct = item.imageUrl?.trim();
          if (direct) acc[item.id] = direct;
          return acc;
        }, {});

        const withOverlay = items.reduce<StockImageMap>(
          (acc, item) => {
            if (withDirect[item.id]) return acc;
            const fromOverlay = lookupClientLecotProductImageOverlay({
              reference: item.reference,
              lecotSku: item.lecotSku,
            });
            if (fromOverlay) acc[item.id] = fromOverlay;
            return acc;
          },
          { ...withDirect }
        );

        const pending = items.filter((item) => !withOverlay[item.id]);
        if (pending.length === 0) {
          if (!cancelled) setImages(withOverlay);
          return;
        }

        try {
          const res = await fetchWithAuth("/api/catalog/lecot-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: pending.map((item) => ({
                reference: item.reference,
                description: item.description,
                imageUrl: item.imageUrl ?? null,
                lecotSku: item.lecotSku ?? null,
              })),
            }),
          });
          if (!res.ok) throw new Error("lecot-images failed");
          const data = (await res.json()) as { images?: Record<string, string | null> };
          if (cancelled) return;

          const resolved: StockImageMap = { ...withOverlay };
          for (const item of pending) {
            const url = data.images?.[item.reference.trim()];
            resolved[item.id] = url ?? null;
          }
          setImages(resolved);
        } catch {
          if (!cancelled) setImages(withOverlay);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, items, payloadKey]);

  return images;
}
