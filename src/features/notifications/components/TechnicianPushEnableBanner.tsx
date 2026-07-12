"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { isAndroidChromeBrowser } from "@/core/pwa/androidAppInstallPromo";
import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import type { FcmUiStatus } from "@/features/notifications/fcmWebPush";
import type { TechnicianNativePushStatus } from "@/features/notifications/hooks/useTechnicianNativePushRegistration";
import MobilePushEnableBanner from "@/features/notifications/components/MobilePushEnableBanner";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";

type Props = {
  native: boolean;
  webAllowed: boolean;
  webStatus: FcmUiStatus;
  registerWebPush: () => Promise<void>;
  nativeStatus: TechnicianNativePushStatus;
  registerNativePush: () => Promise<void>;
};

/** Bannière terrain — Capacitor natif ou PWA (iOS + Android). */
export default function TechnicianPushEnableBanner({
  native,
  webAllowed,
  webStatus,
  registerWebPush,
  nativeStatus,
  registerNativePush,
}: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (isMobile !== true) return null;

  if (native) {
    const visible =
      nativeStatus !== "granted" &&
      nativeStatus !== "registering" &&
      nativeStatus !== "unsupported";

    return (
      <MobilePushEnableBanner
        visible={visible}
        ariaLabel={String(t("notifications.staff_onboarding_ios_title"))}
        hint={String(t("notifications.technician_native_push_hint"))}
        blockedHint={String(t("notifications.staff_push_blocked_hint"))}
        actionLabel={String(t("notifications.staff_push_enable_action"))}
        closeLabel={String(t("common.close"))}
        blocked={nativeStatus === "denied"}
        onEnable={registerNativePush}
      />
    );
  }

  const isAndroidPwa =
    typeof navigator !== "undefined" &&
    (isPwaStandalone() || isAndroidChromeBrowser(navigator.userAgent));

  const visible =
    webAllowed &&
    webStatus !== "registered" &&
    webStatus !== "registering" &&
    webStatus !== "unsupported" &&
    webStatus !== "needs_sign_in" &&
    webStatus !== "needs_vapid";

  return (
    <MobilePushEnableBanner
      visible={visible}
      ariaLabel={String(t("notifications.staff_onboarding_ios_title"))}
      hint={
        isAndroidPwa
          ? String(t("notifications.technician_chrome_push_hint"))
          : String(t("notifications.staff_push_enable_hint"))
      }
      blockedHint={String(t("notifications.staff_push_blocked_hint"))}
      actionLabel={String(t("notifications.staff_push_enable_action"))}
      closeLabel={String(t("common.close"))}
      blocked={webStatus === "blocked"}
      onEnable={registerWebPush}
      variant={isAndroidPwa ? "warning" : "default"}
    />
  );
}
