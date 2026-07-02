"use client";

import { useEffect, useRef } from "react";
import type { FcmUiStatus } from "@/features/notifications/fcmWebPush";
import {
  consumeStaffPushOnboardingPending,
  peekStaffPushOnboardingPending,
} from "@/features/notifications/staffPushOnboarding";
import { shouldAutoPromptForPush } from "@/features/notifications/webPushRegistrationPolicy";

/** Demande la permission push une fois (dashboard staff ou après inscription). */
export function useAutoPushPermissionPrompt(
  registerPush: () => Promise<void>,
  status: FcmUiStatus,
  enabled = true
): void {
  const promptedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const freshSignup = peekStaffPushOnboardingPending();
    if (!shouldAutoPromptForPush() && !freshSignup) return;
    if (promptedRef.current || status !== "idle") return;
    if (typeof Notification === "undefined" || Notification.permission !== "default") return;

    promptedRef.current = true;
    if (freshSignup) consumeStaffPushOnboardingPending();

    const delayMs = freshSignup ? 400 : 0;
    const timer = window.setTimeout(() => {
      void registerPush();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [enabled, status, registerPush]);
}
