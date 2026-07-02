"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDeferredMount } from "@/core/perf/useDeferredMount";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { parseBackofficeChatNotificationSearchParams } from "@/features/notifications/backofficeChatNotificationUrls";
import { parseBackofficeRequestNotificationSearchParams } from "@/features/notifications/backofficeRequestNotificationUrls";
import { parseMaterialOrderNotificationSearchParams } from "@/features/notifications/materialOrderNotificationUrls";

const BackofficeChatNotificationBootstrap = dynamic(
  () => import("@/features/notifications/components/BackofficeChatNotificationBootstrap"),
  { ssr: false }
);
const BackofficeRequestNotificationBootstrap = dynamic(
  () => import("@/features/notifications/components/BackofficeRequestNotificationBootstrap"),
  { ssr: false }
);
const MaterialOrderNotificationBootstrap = dynamic(
  () => import("@/features/notifications/components/MaterialOrderNotificationBootstrap"),
  { ssr: false }
);
const BackofficePushBootstrap = dynamic(
  () => import("@/features/notifications/components/BackofficePushBootstrap"),
  { ssr: false }
);
const AndroidAppInstallPromoBootstrap = dynamic(
  () => import("@/core/pwa/AndroidAppInstallPromoBootstrap"),
  { ssr: false }
);
const AuthActivityLogger = dynamic(
  () => import("@/features/crmHistory/components/AuthActivityLogger"),
  { ssr: false }
);
const ActivityLogPageObserver = dynamic(
  () => import("@/features/crmHistory/components/ActivityLogPageObserver"),
  { ssr: false }
);

function DeferredAdminBootstrapsInner() {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const pushIntent =
    parseBackofficeChatNotificationSearchParams(searchParams).kind !== "none" ||
    parseBackofficeRequestNotificationSearchParams(searchParams).kind !== "none" ||
    parseMaterialOrderNotificationSearchParams(searchParams).kind !== "none";
  const idleReady = useDeferredMount({
    minDelayMs: pushIntent || isMobile !== true ? 0 : 2_500,
    idleTimeoutMs: isMobile === true ? 5_000 : 0,
  });

  if (!pushIntent && !idleReady) return null;

  const pushBootstrapReady = isMobile === true || idleReady;

  return (
    <>
      {pushIntent || idleReady ? <BackofficeChatNotificationBootstrap /> : null}
      {pushIntent || idleReady ? <BackofficeRequestNotificationBootstrap /> : null}
      {pushIntent || idleReady ? <MaterialOrderNotificationBootstrap /> : null}
      {pushBootstrapReady ? <BackofficePushBootstrap /> : null}
      {idleReady ? (
        <>
          <AndroidAppInstallPromoBootstrap surface="admin" />
          <AuthActivityLogger />
          <ActivityLogPageObserver />
        </>
      ) : null}
    </>
  );
}

/** Notifications, PWA promo et logs CRM — après premier idle (sauf deep-link push). */
export default function DeferredAdminBootstraps() {
  return (
    <Suspense fallback={null}>
      <DeferredAdminBootstrapsInner />
    </Suspense>
  );
}
