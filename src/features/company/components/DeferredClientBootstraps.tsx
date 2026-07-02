"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDeferredMount } from "@/core/perf/useDeferredMount";
import { parseClientNotificationSearchParams } from "@/features/notifications/clientNotificationUrls";

const ClientPortalPushBootstrap = dynamic(
  () => import("@/features/notifications/components/ClientPortalPushBootstrap"),
  { ssr: false }
);
const AndroidAppInstallPromoBootstrap = dynamic(
  () => import("@/core/pwa/AndroidAppInstallPromoBootstrap"),
  { ssr: false }
);
const ClientPortalNotificationBootstrap = dynamic(
  () => import("@/features/notifications/components/ClientPortalNotificationBootstrap"),
  { ssr: false }
);

function DeferredClientBootstrapsInner() {
  const searchParams = useSearchParams();
  const pushIntent = parseClientNotificationSearchParams(searchParams).kind !== "none";
  const idleReady = useDeferredMount({
    minDelayMs: 0,
    idleTimeoutMs: pushIntent ? 0 : 800,
  });

  const deferredReady = pushIntent || idleReady;

  return (
    <>
      <ClientPortalPushBootstrap />
      {deferredReady ? <ClientPortalNotificationBootstrap /> : null}
      {idleReady ? <AndroidAppInstallPromoBootstrap surface="demande" /> : null}
    </>
  );
}

/** Notifications / PWA portail client — push immédiat, routing notif différé. */
export default function DeferredClientBootstraps() {
  return (
    <Suspense fallback={null}>
      <DeferredClientBootstrapsInner />
    </Suspense>
  );
}
