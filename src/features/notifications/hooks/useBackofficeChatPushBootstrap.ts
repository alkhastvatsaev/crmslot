"use client";

import { useEffect, useRef } from "react";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useBackofficePushMessaging } from "@/features/notifications/useBackofficePushMessaging";

/** Propose l’activation push une fois à l’ouverture de l’admin (messages chat client). */
export function useBackofficeChatPushBootstrap(enabled = true): void {
  const native = isCapacitorNative();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const { status, registerPush } = useBackofficePushMessaging(vapidKey, {
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
