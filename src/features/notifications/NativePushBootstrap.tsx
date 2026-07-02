"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ensureAndroidPushChannels } from "@/core/native/ensureAndroidPushChannels";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { registerNativePushClickHandler } from "@/core/native/nativePushClickHandler";
import { registerNativePushForegroundHandler } from "@/core/native/nativePushForeground";
import { useStaffNativePushBootstrap } from "@/features/notifications/hooks/useStaffNativePushBootstrap";
import { resolveNativePushAudience } from "@/features/notifications/resolveNativePushAudience";

export default function NativePushBootstrap() {
  const pathname = usePathname();
  const audience = resolveNativePushAudience(pathname);

  useStaffNativePushBootstrap(audience);

  useEffect(() => {
    if (isCapacitorNative()) {
      void ensureAndroidPushChannels();
    }

    let unlistenClick: (() => void) | null = null;
    let unlistenForeground: (() => void) | null = null;
    void registerNativePushClickHandler().then((fn) => {
      unlistenClick = fn;
    });
    void registerNativePushForegroundHandler().then((fn) => {
      unlistenForeground = fn;
    });
    return () => {
      unlistenClick?.();
      unlistenForeground?.();
    };
  }, []);

  return null;
}
