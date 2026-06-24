"use client";

import { useEffect, useRef } from "react";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useTechnicianPushMessaging } from "@/features/notifications/useTechnicianPushMessaging";

/** Propose l’activation push une fois à l’ouverture du hub terrain. */
export function useTechnicianAssignmentPushBootstrap(enabled = true): void {
  const native = isCapacitorNative();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const { status, registerPush } = useTechnicianPushMessaging(vapidKey, {
    enabled: enabled && !native,
  });
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!enabled || native) return;
    if (promptedRef.current || status !== "idle") return;
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    promptedRef.current = true;
    void registerPush();
  }, [enabled, native, status, registerPush]);
}
