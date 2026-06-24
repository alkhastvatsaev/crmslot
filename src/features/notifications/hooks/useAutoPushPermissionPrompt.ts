"use client";

import { useEffect, useRef } from "react";
import type { FcmUiStatus } from "@/features/notifications/fcmWebPush";
import { shouldAutoPromptForPush } from "@/features/notifications/webPushRegistrationPolicy";

/** Demande la permission push une fois sur PWA installée / APK Android. */
export function useAutoPushPermissionPrompt(
  registerPush: () => Promise<void>,
  status: FcmUiStatus,
  enabled = true
): void {
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (!shouldAutoPromptForPush()) return;
    if (promptedRef.current || status !== "idle") return;
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;
    promptedRef.current = true;
    void registerPush();
  }, [enabled, status, registerPush]);
}
