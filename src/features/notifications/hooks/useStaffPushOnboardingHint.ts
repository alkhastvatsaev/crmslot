"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { isPwaStandalone } from "@/core/pwa/isPwaStandalone";
import { isIosWebPushDevice } from "@/features/notifications/fcmWebPush";
import {
  consumeStaffPushOnboardingPending,
  peekStaffPushOnboardingPending,
} from "@/features/notifications/staffPushOnboarding";

/** Après inscription : rappel iOS Safari d’installer la PWA pour les notifications. */
export function useStaffPushOnboardingHint(enabled = true): void {
  const { t } = useTranslation();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!enabled || shownRef.current) return;
    if (!peekStaffPushOnboardingPending()) return;

    if (isCapacitorNative()) {
      consumeStaffPushOnboardingPending();
      return;
    }

    if (isIosWebPushDevice() && !isPwaStandalone()) {
      shownRef.current = true;
      consumeStaffPushOnboardingPending();
      toast.info(String(t("notifications.staff_onboarding_ios_title")), {
        description: String(t("notifications.staff_onboarding_ios_desc")),
        duration: 14_000,
      });
    }
  }, [enabled, t]);
}
