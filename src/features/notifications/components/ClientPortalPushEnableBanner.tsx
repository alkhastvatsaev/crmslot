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

/** Bannière portail client (/m/demande) — tap requis sur iOS PWA. */
export default function ClientPortalPushEnableBanner({ status, registerPush }: Props) {
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
    status !== "needs_vapid" &&
    status !== "not_client";

  return (
    <MobilePushEnableBanner
      visible={visible}
      ariaLabel={String(t("client_push.enable"))}
      hint={String(t("client_push.enable"))}
      blockedHint={String(t("client_push.blocked"))}
      actionLabel={String(t("notifications.staff_push_enable_action"))}
      closeLabel={String(t("common.close"))}
      blocked={status === "blocked"}
      onEnable={registerPush}
    />
  );
}
