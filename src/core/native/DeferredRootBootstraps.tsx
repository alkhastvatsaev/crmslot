"use client";

import dynamic from "next/dynamic";
import { useDeferredMount } from "@/core/perf/useDeferredMount";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";

const NativePushBootstrap = dynamic(() => import("@/features/notifications/NativePushBootstrap"), {
  ssr: false,
});

/** FCM natif Capacitor — différé pour ne pas bloquer le TTI web/mobile. */
export default function DeferredRootBootstraps() {
  const native = typeof window !== "undefined" && isCapacitorNative();
  const ready = useDeferredMount({
    minDelayMs: native ? 400 : 3_000,
    idleTimeoutMs: native ? 1_200 : 6_000,
  });
  if (!ready) return null;
  return <NativePushBootstrap />;
}
