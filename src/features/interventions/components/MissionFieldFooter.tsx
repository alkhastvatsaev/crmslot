"use client";

import { Camera, MapPin, Navigation2, Play, Loader2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import {
  resolveMissionActionBar,
  type MissionActionVariant,
} from "@/features/interventions/missionActionBar";
import { cn } from "@/lib/utils";
import {
  TERRAIN_BTN,
  TERRAIN_BTN_CAPTURE,
  TERRAIN_BTN_ICON,
} from "@/features/interventions/terrainMobileChrome";

type Props = {
  intervention: Pick<Intervention, "status" | "clientPhone" | "phone" | "address" | "clientEmail">;
  isUpdating?: boolean;
  /** Masque Départ / Sur place / Terminer — géré par le time tracking unifié. */
  hideAutomatedActions?: boolean;
  onPrimaryTransition: (toStatus: Intervention["status"]) => void;
  onFinish: () => void;
  onWaitingMaterial?: () => void;
};

function transitionButtonClass(variant: MissionActionVariant): string {
  switch (variant) {
    case "amber":
      return "border-amber-200 bg-amber-500 text-white hover:bg-amber-400";
    case "emerald":
      return "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-500";
    case "purple":
      return "border-violet-200 bg-violet-600 text-white hover:bg-violet-500";
    case "blue":
    default:
      return "border-blue-200 bg-blue-600 text-white hover:bg-blue-500";
  }
}

function renderTransitionIcon(toStatus: Intervention["status"]) {
  const className = "h-6 w-6 shrink-0";
  const stroke = 2.25;
  if (toStatus === "en_route") {
    return <Navigation2 className={className} strokeWidth={stroke} aria-hidden />;
  }
  if (toStatus === "in_progress") {
    return <MapPin className={className} strokeWidth={stroke} aria-hidden />;
  }
  return <Play className={className} strokeWidth={stroke} aria-hidden />;
}

/** Pied de page terrain : une seule action principale. */
export default function MissionFieldFooter({
  intervention,
  isUpdating = false,
  hideAutomatedActions = false,
  onPrimaryTransition,
  onFinish,
}: Props) {
  const { t } = useTranslation();
  const config = resolveMissionActionBar(intervention);

  const primaryHidden =
    hideAutomatedActions &&
    config.primary != null &&
    (config.primary.kind === "transition" || config.primary.kind === "finish");
  const primary = primaryHidden ? null : config.primary;

  if (!primary) return null;

  const handleTransition = () => {
    if (!primary || primary.kind !== "transition" || isUpdating) return;
    onPrimaryTransition(primary.toStatus);
  };

  const transitionPrimary = primary?.kind === "transition" ? primary : null;
  const finishLabel = t("technician_hub.dashboard.detail.finish_job");

  return (
    <footer
      data-testid="mission-action-bar"
      className="flex shrink-0 flex-col items-center border-t border-slate-200/50 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {primary.kind === "finish" ? (
        <button
          type="button"
          data-testid="mission-action-primary-finish"
          disabled={isUpdating}
          onClick={onFinish}
          aria-label={finishLabel}
          className={cn(
            "flex h-14 w-14 items-center justify-center bg-slate-900 text-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.4)] transition active:scale-[0.98] disabled:opacity-60",
            TERRAIN_BTN_CAPTURE
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-6 w-6 shrink-0" strokeWidth={2.25} aria-hidden />
          )}
        </button>
      ) : transitionPrimary ? (
        <button
          type="button"
          data-testid={transitionPrimary.testId}
          disabled={isUpdating}
          onClick={handleTransition}
          className={cn(
            "flex h-14 w-full max-w-[20.5rem] items-center justify-center gap-2.5 border px-4 text-[16px] font-bold shadow-[0_12px_32px_-8px_rgba(15,23,42,0.35)] transition active:scale-[0.99] disabled:opacity-60",
            TERRAIN_BTN,
            transitionButtonClass(transitionPrimary.variant)
          )}
        >
          {isUpdating ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          ) : (
            renderTransitionIcon(transitionPrimary.toStatus)
          )}
          {t(transitionPrimary.labelKey)}
        </button>
      ) : null}
    </footer>
  );
}
