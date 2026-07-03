"use client";

import { BellRing, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";
import { isAndroidChromeBrowser } from "@/core/pwa/androidAppInstallPromo";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useTechnicianNativePushRegistration } from "@/features/notifications/hooks/useTechnicianNativePushRegistration";
import { useTechnicianPushMessaging } from "@/features/notifications/useTechnicianPushMessaging";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";

/**
 * Bannière mobile terrain : active les notifications via un geste utilisateur.
 * - Capacitor (APK/IPA) : permission native → notifications au nom de l’app
 * - Android PWA Chrome : secours web (libellé « Google Chrome » côté OS)
 */
export default function TechnicianPushEnableBanner() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(false);
  const native = isCapacitorNative();
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const webAllowed = !native && isWebPushRegistrationAllowed();
  const { status: webStatus, registerPush: registerWebPush } = useTechnicianPushMessaging(
    vapidKey,
    {
      enabled: webAllowed,
    }
  );
  const { status: nativeStatus, registerPush: registerNativePush } =
    useTechnicianNativePushRegistration(native);

  if (!isMobile || dismissed) return null;

  const isAndroidPwa =
    !native &&
    typeof navigator !== "undefined" &&
    (isPwaStandalone() || isAndroidChromeBrowser(navigator.userAgent));

  if (native) {
    if (
      nativeStatus === "granted" ||
      nativeStatus === "registering" ||
      nativeStatus === "unsupported"
    )
      return null;

    const blocked = nativeStatus === "denied";

    return (
      <div
        role="region"
        aria-label={String(t("notifications.staff_onboarding_ios_title"))}
        className="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-[120] flex justify-center px-3"
      >
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur">
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-slate-800">
            {blocked
              ? String(t("notifications.staff_push_blocked_hint"))
              : String(t("notifications.technician_native_push_hint"))}
          </p>
          {!blocked ? (
            <button
              type="button"
              onClick={() => void registerNativePush()}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white"
            >
              <BellRing className="h-4 w-4" aria-hidden />
              {String(t("notifications.staff_push_enable_action"))}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label={String(t("common.close"))}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!webAllowed || !isAndroidPwa) return null;
  if (webStatus === "registered" || webStatus === "registering" || webStatus === "unsupported")
    return null;
  if (webStatus === "needs_sign_in" || webStatus === "needs_vapid") return null;

  const blocked = webStatus === "blocked";

  return (
    <div
      role="region"
      aria-label={String(t("notifications.staff_onboarding_ios_title"))}
      className="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-[120] flex justify-center px-3"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-2xl border border-amber-200/90 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur">
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-slate-800">
          {blocked
            ? String(t("notifications.staff_push_blocked_hint"))
            : String(t("notifications.technician_chrome_push_hint"))}
        </p>
        {!blocked ? (
          <button
            type="button"
            onClick={() => void registerWebPush()}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white"
          >
            <BellRing className="h-4 w-4" aria-hidden />
            {String(t("notifications.staff_push_enable_action"))}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          aria-label={String(t("common.close"))}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
