"use client";

import {
  Camera,
  MapPin,
  Navigation,
  Package,
  Pause,
  Phone,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import {
  resolveMissionActionBar,
  type MissionActionVariant,
} from "@/features/interventions/missionActionBar";
import { formatAddress } from "@/utils/stringUtils";

const variantClass: Record<MissionActionVariant, string> = {
  blue: "bg-blue-600 hover:bg-blue-700 shadow-[0_14px_40px_-14px_rgba(37,99,235,0.55)]",
  amber: "bg-amber-500 hover:bg-amber-600 shadow-[0_14px_40px_-14px_rgba(245,158,11,0.55)]",
  emerald: "bg-emerald-600 hover:bg-emerald-700 shadow-[0_14px_40px_-14px_rgba(5,150,105,0.45)]",
  purple:
    "bg-purple-600 hover:bg-purple-700 shadow-[0_14px_40px_-14px_rgba(147,51,234,0.45)]",
};

type Props = {
  intervention: Pick<
    Intervention,
    | "status"
    | "clientPhone"
    | "phone"
    | "address"
    | "assignedTechnicianUid"
  >;
  awaitingAssignment?: boolean;
  isUpdating?: boolean;
  onPrimaryTransition: (toStatus: Intervention["status"]) => void;
  onFinish: () => void;
  onWaitingMaterial?: () => void;
  onOpenMaterials?: () => void;
  onQuickPhoto?: () => void;
};

export default function MissionActionBar({
  intervention,
  awaitingAssignment = false,
  isUpdating = false,
  onPrimaryTransition,
  onFinish,
  onWaitingMaterial,
  onOpenMaterials,
  onQuickPhoto,
}: Props) {
  const { t } = useTranslation();
  const config = resolveMissionActionBar(intervention, { awaitingAssignment });
  const phone = intervention.clientPhone || intervention.phone;
  const mapsUrl = intervention.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(intervention.address))}`
    : null;

  if (!config.primary && !config.showQuickRow) return null;

  const renderPrimaryIcon = () => {
    if (!config.primary) return null;
    if (config.primary.kind === "finish") {
      return <Camera className="h-5 w-5 shrink-0" />;
    }
    if (config.primary.toStatus === "en_route") {
      return <Play className="h-5 w-5 shrink-0" />;
    }
    if (config.primary.toStatus === "in_progress") {
      return <MapPin className="h-5 w-5 shrink-0" />;
    }
    return <Play className="h-5 w-5 shrink-0" />;
  };

  const handlePrimary = () => {
    if (!config.primary || isUpdating) return;
    if (config.primary.kind === "finish") {
      onFinish();
      return;
    }
    onPrimaryTransition(config.primary.toStatus);
  };

  const primaryVariant: MissionActionVariant =
    config.primary?.kind === "transition" ? config.primary.variant : "purple";

  return (
    <div
      data-testid="mission-action-bar"
      className="shrink-0 border-t border-black/[0.06] bg-white/95 px-4 py-3 backdrop-blur-md"
    >
      {config.showQuickRow ? (
        <div
          className="mb-3 flex justify-around gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
          data-testid="mission-action-quick-row"
        >
          {phone ? (
            <a
              href={`tel:${phone}`}
              data-testid="mission-action-call"
              className="flex min-w-[72px] flex-col items-center gap-1 rounded-xl p-2 text-blue-600 transition-colors hover:bg-slate-50"
            >
              <div className="rounded-full bg-blue-50 p-2 shadow-sm">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold">{t("common.call")}</span>
            </a>
          ) : null}
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="mission-action-navigate"
              className="flex min-w-[72px] flex-col items-center gap-1 rounded-xl p-2 text-emerald-600 transition-colors hover:bg-slate-50"
            >
              <div className="rounded-full bg-emerald-50 p-2 shadow-sm">
                <Navigation className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold">{t("common.navigate")}</span>
            </a>
          ) : null}
          {config.canMaterials && onOpenMaterials ? (
            <button
              type="button"
              data-testid="mission-action-materials"
              onClick={onOpenMaterials}
              className="flex min-w-[72px] flex-col items-center gap-1 rounded-xl p-2 text-amber-600 transition-colors hover:bg-slate-50"
            >
              <div className="rounded-full bg-amber-50 p-2 shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold">{t("common.materials")}</span>
            </button>
          ) : null}
          {intervention.status === "in_progress" && onQuickPhoto ? (
            <button
              type="button"
              data-testid="mission-action-photo"
              onClick={onQuickPhoto}
              className="flex min-w-[72px] flex-col items-center gap-1 rounded-xl p-2 text-violet-600 transition-colors hover:bg-slate-50"
            >
              <div className="rounded-full bg-violet-50 p-2 shadow-sm">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold">{t("technician_hub.mission_action.photo")}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      {intervention.status === "in_progress" && onWaitingMaterial ? (
        <button
          type="button"
          data-testid="technician-waiting-material-btn"
          disabled={isUpdating}
          onClick={onWaitingMaterial}
          className="mb-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[20px] border border-amber-200 bg-amber-50 px-4 text-[15px] font-bold text-amber-950 transition hover:bg-amber-100 disabled:opacity-70"
        >
          <Pause className="h-4 w-4 shrink-0" />
          {t("technician_hub.dashboard.detail.waiting_material")}
        </button>
      ) : null}

      {config.primary ? (
        <button
          type="button"
          data-testid={config.primary.testId}
          disabled={isUpdating}
          onClick={handlePrimary}
          className={cn(
            "group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[22px] px-4 text-[17px] font-bold text-white transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70",
            variantClass[primaryVariant],
          )}
        >
          {renderPrimaryIcon()}
          {isUpdating
            ? t("technician_hub.dashboard.detail.updating")
            : t(config.primary.labelKey)}
        </button>
      ) : null}
    </div>
  );
}