"use client";

import { BellRing, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useBackofficePushMessaging } from "@/features/notifications/useBackofficePushMessaging";
import { isWebPushRegistrationAllowed } from "@/features/notifications/webPushRegistrationPolicy";

/**
 * Bannière mobile : active les notifications admin via un geste utilisateur
 * (requis sur iOS PWA ; complète l’auto-prompt Android).
 */
export default function BackofficePushEnableBanner() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(false);
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const webAllowed = isWebPushRegistrationAllowed();
  const { status, registerPush } = useBackofficePushMessaging(vapidKey, {
    enabled: webAllowed,
  });

  if (!isMobile || dismissed || isCapacitorNative()) return null;
  if (!webAllowed) return null;
  if (status === "registered" || status === "registering" || status === "unsupported") return null;
  if (status === "needs_sign_in" || status === "needs_vapid") return null;

  const blocked = status === "blocked";

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
            : String(t("notifications.staff_push_enable_hint"))}
        </p>
        {!blocked ? (
          <button
            type="button"
            onClick={() => void registerPush()}
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
