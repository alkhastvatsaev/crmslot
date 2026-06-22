"use client";

import { useEffect, useRef } from "react";
import { useTechnicianPushMessaging } from "@/features/notifications/useTechnicianPushMessaging";

/** Propose l’activation push une fois à l’ouverture du hub terrain. */
export function useTechnicianAssignmentPushBootstrap(enabled = true): void {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const { status, registerPush } = useTechnicianPushMessaging(vapidKey);
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (promptedRef.current || status !== "idle") return;
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    promptedRef.current = true;
    void registerPush();
  }, [enabled, status, registerPush]);
}
