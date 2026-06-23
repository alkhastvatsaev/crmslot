"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useDeferredMount } from "@/core/perf/useDeferredMount";

const AndroidAppInstallPromoBootstrap = dynamic(
  () => import("@/core/pwa/AndroidAppInstallPromoBootstrap"),
  { ssr: false }
);
const ClientPortalNotificationBootstrap = dynamic(
  () => import("@/features/notifications/components/ClientPortalNotificationBootstrap"),
  { ssr: false }
);

function DeferredClientBootstrapsInner() {
  const idleReady = useDeferredMount({ minDelayMs: 2_500, idleTimeoutMs: 6_000 });
  if (!idleReady) return null;

  return (
    <>
      <ClientPortalNotificationBootstrap />
      <AndroidAppInstallPromoBootstrap surface="demande" />
    </>
  );
}

/** Notifications / PWA portail client — après premier idle. */
export default function DeferredClientBootstraps() {
  return (
    <Suspense fallback={null}>
      <DeferredClientBootstrapsInner />
    </Suspense>
  );
}
