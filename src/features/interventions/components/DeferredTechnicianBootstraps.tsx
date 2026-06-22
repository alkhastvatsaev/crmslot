"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useDeferredMount } from "@/core/perf/useDeferredMount";
import { useMobileEmergencyLite } from "@/core/perf/useMobileEmergencyLite";
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
  const emergencyLite = useMobileEmergencyLite();
  const pushIntent = parseTechnicianNotificationSearchParams(searchParams).kind !== "none";
  const idleReady = useDeferredMount({
    minDelayMs: pushIntent ? 0 : emergencyLite ? 12_000 : 3_000,
    idleTimeoutMs: emergencyLite ? 18_000 : 6_000,
  });

  useTechnicianAssignmentPushBootstrap(idleReady && !emergencyLite);

  if (!pushIntent && !idleReady) return null;

  const skipHeavy = emergencyLite && !pushIntent;

  return (
    <>
      {pushIntent || idleReady ? <TechnicianNotificationBootstrap /> : null}
      {idleReady && !skipHeavy ? (
        <AndroidAppInstallPromoBootstrap surface="technician" presentation="toast" />
      ) : null}
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
