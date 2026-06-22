"use client";

import dynamic from "next/dynamic";
import { useDeferredMount } from "@/core/perf/useDeferredMount";

const NativePushBootstrap = dynamic(() => import("@/features/notifications/NativePushBootstrap"), {
  ssr: false,
});

/** FCM natif Capacitor — différé pour ne pas bloquer le TTI web/mobile. */
export default function DeferredRootBootstraps() {
  const ready = useDeferredMount({ minDelayMs: 3_000, idleTimeoutMs: 6_000 });
  if (!ready) return null;
  return <NativePushBootstrap />;
}
