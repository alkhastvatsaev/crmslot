"use client";

import { useState } from "react";
import { Camera, MapPin, Navigation2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { resolveMissionActionBar } from "@/features/interventions/missionActionBar";
import { SlideAction } from "@/components/ui/slide-action";

type Props = {
  intervention: Pick<Intervention, "status" | "clientPhone" | "phone" | "address" | "clientEmail">;
  isUpdating?: boolean;
  onPrimaryTransition: (toStatus: Intervention["status"]) => void;
  onFinish: () => void;
  onWaitingMaterial?: () => void;
};

/** Pied de page terrain : une seule action principale ; le reste est repliable. */
export default function MissionFieldFooter({
  intervention,
  isUpdating = false,
  onPrimaryTransition,
  onFinish,
  onWaitingMaterial,
}: Props) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const config = resolveMissionActionBar(intervention);

  if (!config.primary) return null;

  const handleTransition = () => {
    if (!config.primary || config.primary.kind !== "transition" || isUpdating) return;
    onPrimaryTransition(config.primary.toStatus);
  };

  const slideIcon =
    config.primary.kind === "transition" && config.primary.toStatus === "en_route"
      ? Navigation2
      : config.primary.kind === "transition" && config.primary.toStatus === "in_progress"
        ? MapPin
        : Play;

  const slideLabel =
    config.primary.kind === "transition" ? t(config.primary.labelKey) : "";

  const showMore =
    intervention.status === "in_progress" &&
    Boolean(onWaitingMaterial);

  return (
    <footer
      data-testid="mission-action-bar"
      className="shrink-0 flex flex-col items-center border-t border-slate-200/50 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
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
            <button
              type="button"
              data-testid="technician-waiting-material-btn"
              disabled={isUpdating}
              onClick={onWaitingMaterial}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              {t("technician_hub.dashboard.detail.waiting_material")}
            </button>
          ) : null}
        </div>
      ) : null}

      {config.primary.kind === "finish" ? (
        <button
          type="button"
          data-testid="mission-action-primary-finish"
          disabled={isUpdating}
          onClick={onFinish}
          className={cn(
            "flex h-14 w-full max-w-[20.5rem] items-center justify-center gap-2.5 rounded-full bg-slate-900 text-[15px] font-semibold text-white shadow-[0_12px_32px_-8px_rgba(15,23,42,0.4)] transition active:scale-[0.98] disabled:opacity-50",
          )}
        >
          <Camera className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
          {t(config.primary.labelKey)}
        </button>
      ) : (
        <div className="w-full max-w-[20.5rem]">
          <SlideAction
            testId={config.primary.testId}
            label={slideLabel}
            icon={slideIcon}
            disabled={isUpdating}
            variant="premium"
            compact
            onAction={handleTransition}
          />
        </div>
      )}
    </footer>
  );
}
