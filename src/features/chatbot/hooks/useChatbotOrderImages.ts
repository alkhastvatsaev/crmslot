"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";
import type { ChatbotOrderImageLookup } from "@/features/chatbot/chatbotOrderImageLookup";

export type ChatbotOrderImageMap = Record<string, string | null>;

type Options = {
  enabled?: boolean;
};

/** Vignettes Lecot pour les commandes affichées dans le panneau Commandes. */
export function useChatbotOrderImages(
  lookups: ChatbotOrderImageLookup[],
  options?: Options
): ChatbotOrderImageMap {
  const enabled = options?.enabled ?? true;
  const [images, setImages] = useState<ChatbotOrderImageMap>({});

  const payloadKey = useMemo(
    () =>
      lookups
        .map(
          (row) =>
            `${row.orderId}|${row.reference}|${row.description ?? ""}|${row.lecotSku ?? ""}|${row.imageUrl ?? ""}`
        )
        .join("\n"),
    [lookups]
  );

  useEffect(() => {
    if (!enabled || lookups.length === 0) {
      setImages((prev) => (Object.keys(prev).length === 0 ? prev : {}));
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const withOverlay = lookups.reduce<ChatbotOrderImageMap>((acc, row) => {
          const direct = row.imageUrl?.trim();
          if (direct) {
            acc[row.orderId] = direct;
            return acc;
          }
          const fromOverlay = lookupClientLecotProductImageOverlay({
            reference: row.reference,
            lecotSku: row.lecotSku,
            description: row.description,
          });
          if (fromOverlay) acc[row.orderId] = fromOverlay;
          return acc;
        }, {});

        const pending = lookups.filter((row) => !withOverlay[row.orderId]);
        if (pending.length === 0) {
          if (!cancelled) {
            setImages((prev) =>
              JSON.stringify(prev) === JSON.stringify(withOverlay) ? prev : withOverlay
            );
          }
          return;
        }

        try {
          const res = await fetchWithAuth("/api/catalog/lecot-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: pending.map((row) => ({
                reference: row.reference,
                description: row.description ?? null,
                imageUrl: row.imageUrl ?? null,
                lecotSku: row.lecotSku ?? null,
              })),
            }),
          });
          if (!res.ok) throw new Error("lecot-images failed");
          const data = (await res.json()) as { images?: Record<string, string | null> };
          if (cancelled) return;

          const resolved: ChatbotOrderImageMap = { ...withOverlay };
          for (const row of pending) {
            resolved[row.orderId] = data.images?.[row.reference.trim()] ?? null;
          }
          if (!cancelled) {
            setImages((prev) =>
              JSON.stringify(prev) === JSON.stringify(resolved) ? prev : resolved
            );
          }
        } catch {
          if (!cancelled) {
            setImages((prev) =>
              JSON.stringify(prev) === JSON.stringify(withOverlay) ? prev : withOverlay
            );
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, payloadKey, lookups]);

  return images;
}
