"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDeferredMount } from "@/core/perf/useDeferredMount";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileEmergencyLite } from "@/core/perf/useMobileEmergencyLite";
import { parseBackofficeChatNotificationSearchParams } from "@/features/notifications/backofficeChatNotificationUrls";

const BackofficeChatNotificationBootstrap = dynamic(
  () => import("@/features/notifications/components/BackofficeChatNotificationBootstrap"),
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
  const emergencyLite = useMobileEmergencyLite();
  const pushIntent = parseBackofficeChatNotificationSearchParams(searchParams).kind !== "none";
  const idleReady = useDeferredMount({
    minDelayMs: pushIntent || isMobile !== true ? 0 : emergencyLite ? 8_000 : 2_500,
    idleTimeoutMs: isMobile === true ? (emergencyLite ? 12_000 : 5_000) : 0,
  });

  if (!pushIntent && !idleReady) return null;

  const skipHeavyMobile = isMobile === true && emergencyLite && !pushIntent;

  return (
    <>
      {pushIntent || idleReady ? <BackofficeChatNotificationBootstrap /> : null}
      {idleReady && !skipHeavyMobile ? (
        <>
          <BackofficePushBootstrap />
          <AndroidAppInstallPromoBootstrap surface="admin" presentation="dialog" />
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
