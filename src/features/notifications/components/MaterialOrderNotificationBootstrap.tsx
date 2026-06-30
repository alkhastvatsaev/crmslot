"use client";

import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardPagerOptional } from "@/features/dashboard";
import {
  applyMaterialOrderNotificationIntent,
  MATERIAL_ORDER_NOTIFICATION_INTENT_EVENT,
} from "@/features/notifications/materialOrderNotificationIntent";
import {
  parseMaterialOrderNotificationSearchParams,
  type MaterialOrderNotificationIntent,
} from "@/features/notifications/materialOrderNotificationUrls";

/** Traite `bmMaterialOrder` après clic push commande matériel. */
export default function MaterialOrderNotificationBootstrap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pager = useDashboardPagerOptional();

  const handleIntent = useCallback(
    (intent: MaterialOrderNotificationIntent, fromUrl: boolean) => {
      applyMaterialOrderNotificationIntent(intent, {
        pager,
        router,
        searchParams: fromUrl ? searchParams : undefined,
      });
    },
    [pager, router, searchParams]
  );

  useEffect(() => {
    const intent = parseMaterialOrderNotificationSearchParams(searchParams);
    if (intent.kind === "none") return;
    handleIntent(intent, true);
  }, [searchParams, handleIntent]);

  useEffect(() => {
    const onIntent = (event: Event) => {
      const intent = (event as CustomEvent<MaterialOrderNotificationIntent>).detail;
      if (!intent || intent.kind === "none") return;
      handleIntent(intent, false);
    };
    window.addEventListener(MATERIAL_ORDER_NOTIFICATION_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(MATERIAL_ORDER_NOTIFICATION_INTENT_EVENT, onIntent);
  }, [handleIntent]);

  return null;
}
