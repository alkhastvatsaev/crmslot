"use client";

import BackofficePushEnableBanner from "@/features/notifications/components/BackofficePushEnableBanner";
import { useBackofficeChatPushBootstrap } from "@/features/notifications/hooks/useBackofficeChatPushBootstrap";
import { useStaffPushOnboardingHint } from "@/features/notifications/hooks/useStaffPushOnboardingHint";

/**
 * Enregistre le jeton FCM web admin + bannière mobile (geste requis iOS PWA).
 * Android/desktop : dialogue système auto via useAutoPushPermissionPrompt.
 */
export default function BackofficePushBootstrap() {
  const { status, registerPush } = useBackofficeChatPushBootstrap();
  useStaffPushOnboardingHint();
  return <BackofficePushEnableBanner status={status} registerPush={registerPush} />;
}
