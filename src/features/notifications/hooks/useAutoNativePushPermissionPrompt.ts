"use client";

import { useEffect, useRef } from "react";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import type { TechnicianNativePushStatus } from "@/features/notifications/hooks/useTechnicianNativePushRegistration";

/** Demande la permission push native au premier lancement (comme iOS). */
export function useAutoNativePushPermissionPrompt(
  registerPush: () => Promise<void>,
  status: TechnicianNativePushStatus,
  enabled = true
): void {
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isCapacitorNative()) return;
    if (promptedRef.current || status !== "idle") return;

    promptedRef.current = true;
    const timer = window.setTimeout(() => {
      void registerPush();
    }, 900);

    return () => window.clearTimeout(timer);
  }, [enabled, registerPush, status]);
}
