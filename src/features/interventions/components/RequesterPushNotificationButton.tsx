"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useClientPortalPush } from "@/features/notifications/ClientPortalPushContext";

export default function RequesterPushNotificationButton() {
  const { t } = useTranslation();
  const { status, registerPush } = useClientPortalPush();

  if (status === "not_client" || status === "unsupported" || status === "needs_vapid") {
    return null;
  }

  const disabled =
    status === "blocked" ||
    status === "needs_sign_in" ||
    status === "registered" ||
    status === "registering";

  return (
    <button
      type="button"
      data-testid="requester-push-enable"
      disabled={disabled}
      onClick={() => void registerPush()}
      className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {status === "registering" ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : status === "blocked" ? (
        <BellOff className="h-4 w-4 text-amber-600" aria-hidden />
      ) : (
        <Bell className="h-4 w-4 text-blue-600" aria-hidden />
      )}
      {status === "registered"
        ? t("client_push.enabled")
        : status === "blocked"
          ? t("client_push.blocked")
          : t("client_push.enable")}
    </button>
  );
}
