"use client";

import { useState } from "react";
import { Camera, MapPin, Navigation2, Play } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { resolveMissionActionBar } from "@/features/interventions/missionActionBar";
import { SlideAction } from "@/components/ui/slide-action";
import { HubButton } from "@/core/ui/hub";

type Props = {
  intervention: Pick<Intervention, "status" | "clientPhone" | "phone" | "address" | "clientEmail">;
  isUpdating?: boolean;
  /** Masque Départ / Sur place / Terminer — géré par le time tracking unifié. */
  hideAutomatedActions?: boolean;
  onPrimaryTransition: (toStatus: Intervention["status"]) => void;
  onFinish: () => void;
  onWaitingMaterial?: () => void;
};

/** Pied de page terrain : une seule action principale ; le reste est repliable. */
export default function MissionFieldFooter({
  intervention,
  isUpdating = false,
  hideAutomatedActions = false,
  onPrimaryTransition,
  onFinish,
  onWaitingMaterial,
}: Props) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const config = resolveMissionActionBar(intervention);

  const primaryHidden =
    hideAutomatedActions &&
    config.primary != null &&
    (config.primary.kind === "transition" || config.primary.kind === "finish");
  const primary = primaryHidden ? null : config.primary;

  const showMore = intervention.status === "in_progress" && Boolean(onWaitingMaterial);

  if (!primary && !showMore) return null;

  const handleTransition = () => {
    if (!primary || primary.kind !== "transition" || isUpdating) return;
    onPrimaryTransition(primary.toStatus);
  };

  const slideIcon =
    primary?.kind === "transition" && primary.toStatus === "en_route"
      ? Navigation2
      : primary?.kind === "transition" && primary.toStatus === "in_progress"
        ? MapPin
        : Play;

  const slideLabel = primary?.kind === "transition" ? t(primary.labelKey) : "";

  return (
    <footer
      data-testid="mission-action-bar"
      className="flex shrink-0 flex-col items-center border-t border-slate-200/50 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      {showMore ? (
        <div className="mb-3 w-full max-w-[20.5rem]">
          <button
            type="button"
            data-testid="mission-more-toggle"
            onClick={() => setMoreOpen((v) => !v)}
            className="w-full text-center text-[12px] font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            {moreOpen
              ? t("technician_hub.dashboard.field_footer.less")
              : t("technician_hub.dashboard.field_footer.more")}
          </button>
          {moreOpen ? (
            <HubButton
              type="button"
              variant="secondary"
              fullWidth
              data-testid="technician-waiting-material-btn"
              disabled={isUpdating}
              onClick={onWaitingMaterial}
              className="mt-2 min-h-[42px] text-[13px] font-medium"
            >
              {t("technician_hub.dashboard.detail.waiting_material")}
            </HubButton>
          ) : null}
        </div>
      ) : null}

      {primary?.kind === "finish" ? (
        <HubButton
          type="button"
          data-testid="mission-action-primary-finish"
          disabled={isUpdating}
          onClick={onFinish}
          fullWidth
          className="h-14 max-w-[20.5rem] rounded-full text-[15px] font-semibold shadow-[0_12px_32px_-8px_rgba(15,23,42,0.4)]"
        >
          <Camera className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
          {t(primary.labelKey)}
        </HubButton>
      ) : primary?.kind === "transition" ? (
        <div className="w-full max-w-[20.5rem]">
          <SlideAction
            testId={primary.testId}
            label={slideLabel}
            icon={slideIcon}
            disabled={isUpdating}
            variant="premium"
            compact
            onAction={handleTransition}
          />
        </div>
      ) : null}
    </footer>
  );
}
