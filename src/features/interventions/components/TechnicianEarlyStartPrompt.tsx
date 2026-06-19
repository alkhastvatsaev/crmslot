"use client";

import { Clock } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  formatTechnicianScheduledAppointmentLabel,
  mapI18nLanguageToLocale,
} from "@/features/interventions/technicianSchedule";
import type { Intervention } from "@/features/interventions/types";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN } from "@/features/interventions/terrainMobileChrome";

type Props = {
  intervention: Intervention;
  awaitingAssignment: boolean;
  isUpdating?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

/** Bandeau par-dessus la fiche mission — démarrage avant le créneau planifié. */
export default function TechnicianEarlyStartPrompt({
  intervention,
  awaitingAssignment,
  isUpdating = false,
  onConfirm,
  onDismiss,
}: Props) {
  const { t, language } = useTranslation();
  const locale = mapI18nLanguageToLocale(language);
  const scheduleLabel =
    formatTechnicianScheduledAppointmentLabel(intervention, locale) ??
    String(t("technician_hub.dashboard.detail.early_start_schedule_unknown"));

  const confirmLabel = awaitingAssignment
    ? String(t("technician_hub.dashboard.detail.accept_assignment"))
    : String(t("technician_hub.dashboard.detail.start_intervention"));

  return (
    <div
      data-testid="technician-early-start-prompt"
      className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 px-4 backdrop-blur-[3px]"
      role="region"
      aria-label={String(t("technician_hub.dashboard.detail.early_start_title"))}
    >
      <div className="w-full max-w-sm rounded-2xl border border-amber-200/90 bg-white p-4 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.2)]">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
            <Clock className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold leading-snug text-slate-900">
              {t("technician_hub.dashboard.detail.early_start_title")}
            </p>
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-slate-600">
              {t("technician_hub.dashboard.detail.early_start_message", {
                schedule: scheduleLabel,
              })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            data-testid="technician-early-start-confirm"
            disabled={isUpdating}
            onClick={onConfirm}
            className={cn(
              "flex min-h-[44px] items-center justify-center rounded-[14px] border border-emerald-200 bg-emerald-600 px-4 text-[14px] font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-60",
              TERRAIN_BTN
            )}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            data-testid="technician-early-start-dismiss"
            disabled={isUpdating}
            onClick={onDismiss}
            className="flex min-h-[44px] items-center justify-center rounded-[14px] border border-slate-200 bg-slate-50 px-4 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60"
          >
            {t("technician_hub.dashboard.detail.early_start_wait")}
          </button>
        </div>
      </div>
    </div>
  );
}
