"use client";

import ClientPortalPushEnableBanner from "@/features/notifications/components/ClientPortalPushEnableBanner";
import { useAutoPushPermissionPrompt } from "@/features/notifications/hooks/useAutoPushPermissionPrompt";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";
import { useClientPortalPushMessaging } from "@/features/notifications/useClientPortalPushMessaging";

/**
 * Enregistre le jeton FCM web portail client (comme admin/terrain).
 * Avant : uniquement le bouton manuel → aucun jeton sur mobile.
 */
export default function ClientPortalPushBootstrap() {
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const webAllowed = isWebPushRegistrationAllowed();
  const { status, registerPush } = useClientPortalPushMessaging(vapidKey, {
    enabled: webAllowed,
  });

  useAutoPushPermissionPrompt(registerPush, status, webAllowed);

  return <ClientPortalPushEnableBanner status={status} registerPush={registerPush} />;
}
