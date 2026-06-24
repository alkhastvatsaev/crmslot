"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDeferredMount } from "@/core/perf/useDeferredMount";
import { parseClientNotificationSearchParams } from "@/features/notifications/clientNotificationUrls";

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
    minDelayMs: pushIntent ? 0 : 2_500,
    idleTimeoutMs: 6_000,
  });

  if (!pushIntent && !idleReady) return null;

  return (
    <>
      {pushIntent || idleReady ? <ClientPortalNotificationBootstrap /> : null}
      {idleReady ? <AndroidAppInstallPromoBootstrap surface="demande" /> : null}
    </>
  );
}

/** Notifications / PWA portail client — après idle (sauf deep-link notif). */
export default function DeferredClientBootstraps() {
  return (
    <Suspense fallback={null}>
      <DeferredClientBootstrapsInner />
    </Suspense>
  );
}
