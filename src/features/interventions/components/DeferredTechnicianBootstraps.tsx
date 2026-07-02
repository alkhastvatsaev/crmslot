"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDeferredMount } from "@/core/perf/useDeferredMount";
import { useTechnicianAssignmentPushBootstrap } from "@/features/interventions/hooks/useTechnicianAssignmentPushBootstrap";
import { parseTechnicianNotificationSearchParams } from "@/features/notifications/technicianNotificationUrls";

const TechnicianNotificationBootstrap = dynamic(
  () => import("@/features/notifications/components/TechnicianNotificationBootstrap"),
  { ssr: false }
);
const AndroidAppInstallPromoBootstrap = dynamic(
  () => import("@/core/pwa/AndroidAppInstallPromoBootstrap"),
  { ssr: false }
);

function DeferredTechnicianBootstrapsInner() {
  const searchParams = useSearchParams();
  const pushIntent = parseTechnicianNotificationSearchParams(searchParams).kind !== "none";
  const idleReady = useDeferredMount({
    minDelayMs: 0,
    idleTimeoutMs: 1_000,
  });

  useTechnicianAssignmentPushBootstrap(true);

  const deferredReady = pushIntent || idleReady;

  return (
    <>
      {deferredReady ? <TechnicianNotificationBootstrap /> : null}
      {idleReady ? <AndroidAppInstallPromoBootstrap surface="technician" /> : null}
    </>
  );
}

/** Notifications / PWA / FCM terrain — après idle (sauf deep-link notif). */
export default function DeferredTechnicianBootstraps() {
  return (
    <Suspense fallback={null}>
      <DeferredTechnicianBootstrapsInner />
    </Suspense>
  );
}
