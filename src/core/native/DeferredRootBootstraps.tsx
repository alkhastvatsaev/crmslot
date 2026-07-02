"use client";

import dynamic from "next/dynamic";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";

const NativePushBootstrap = dynamic(() => import("@/features/notifications/NativePushBootstrap"), {
  ssr: false,
});

/** FCM natif Capacitor — monté dès l’ouverture (pas de délai idle). */
export default function DeferredRootBootstraps() {
  if (typeof window !== "undefined" && !isCapacitorNative()) return null;
  return <NativePushBootstrap />;
}
