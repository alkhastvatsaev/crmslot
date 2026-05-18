"use client";

import { useEffect, useRef } from "react";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useTranslation } from "@/core/i18n/I18nContext";
import { buildInterventionReminders } from "@/features/reminders/interventionReminders";
import type { Intervention } from "@/features/interventions/types";

const STORAGE_KEY = "belgmap_bo_reminder_push_day";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Notification navigateur (une fois / jour) si des rappels BO sont actifs.
 * Complète les push FCM — ne remplace pas l’envoi serveur.
 */
export function useBackofficeReminderPush(interventions: Intervention[]): void {
  const enabled = useFeatureFlag("pwaV2Bundle");
  const { t } = useTranslation();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || firedRef.current || typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    const reminders = buildInterventionReminders(interventions);
    if (reminders.length === 0) return;

    const day = todayKey();
    if (localStorage.getItem(STORAGE_KEY) === day) return;

    const show = () => {
      if (Notification.permission !== "granted") return;
      const body = String(t("reminders.push_body")).replace("{count}", String(reminders.length));
      try {
        // eslint-disable-next-line no-new
        new Notification(String(t("reminders.push_title")), { body, tag: "belgmap-bo-reminders" });
        localStorage.setItem(STORAGE_KEY, day);
        firedRef.current = true;
      } catch {
        /* ignore */
      }
    };

    if (Notification.permission === "granted") {
      show();
      return;
    }
    if (Notification.permission === "default") {
      void Notification.requestPermission().then((p) => {
        if (p === "granted") show();
      });
    }
  }, [enabled, interventions, t]);
}
