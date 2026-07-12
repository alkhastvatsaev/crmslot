"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import type { FcmUiStatus } from "@/features/notifications/fcmWebPush";
import MobilePushEnableBanner from "@/features/notifications/components/MobilePushEnableBanner";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";

type Props = {
  status: FcmUiStatus;
  registerPush: () => Promise<void>;
};

/** Bannière admin/inbox — tap requis sur iOS PWA pour autoriser les notifications. */
export default function BackofficePushEnableBanner({ status, registerPush }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const webAllowed = isWebPushRegistrationAllowed();

  const visible =
    isMobile === true &&
    !isCapacitorNative() &&
    webAllowed &&
    status !== "registered" &&
    status !== "registering" &&
    status !== "unsupported" &&
    status !== "needs_sign_in" &&
    status !== "needs_vapid";

  return (
    <MobilePushEnableBanner
      visible={visible}
      ariaLabel={String(t("notifications.staff_onboarding_ios_title"))}
      hint={String(t("notifications.staff_push_enable_hint"))}
      blockedHint={String(t("notifications.staff_push_blocked_hint"))}
      actionLabel={String(t("notifications.staff_push_enable_action"))}
      closeLabel={String(t("common.close"))}
      blocked={status === "blocked"}
      onEnable={registerPush}
    />
  );
}
