"use client";

import {
  Camera,
  Clock,
  MapPin,
  Navigation2,
  Package,
  Phone,
  Play,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { resolveMissionActionBar } from "@/features/interventions/missionActionBar";
import { formatAddress } from "@/utils/stringUtils";
import FieldIconButton, { FieldIconButtonRow } from "@/core/ui/FieldIconButton";
import { SlideAction } from "@/components/ui/slide-action";

type Props = {
  intervention: Pick<
    Intervention,
    | "status"
    | "clientPhone"
    | "phone"
    | "address"
    | "assignedTechnicianUid"
    | "clientEmail"
  >;
  awaitingAssignment?: boolean;
  isUpdating?: boolean;
  onPrimaryTransition: (toStatus: Intervention["status"]) => void;
  onFinish: () => void;
  onWaitingMaterial?: () => void;
  onOpenMaterials?: () => void;
  onQuickPhoto?: () => void;
  /** Panneau technicien : barre plus basse pour tenir sans scroll. */
  compact?: boolean;
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
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const config = resolveMissionActionBar(intervention, { awaitingAssignment });
  const phone = intervention.clientPhone || intervention.phone;
  const email = intervention.clientEmail;
  const mapsUrl = intervention.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(intervention.address))}`
    : null;

  if (!config.primary && !config.showQuickRow) return null;

  const handleTransition = () => {
    if (!config.primary || config.primary.kind !== "transition" || isUpdating) return;
    onPrimaryTransition(config.primary.toStatus);
  };

  const slideIcon =
    config.primary?.kind === "transition" && config.primary.toStatus === "en_route"
      ? Navigation2
      : config.primary?.kind === "transition" && config.primary.toStatus === "in_progress"
        ? MapPin
        : Play;

  const slideLabel =
    config.primary?.kind === "transition"
      ? t(config.primary.labelKey)
      : "";

  return (
    <div
      data-testid="mission-action-bar"
      className="shrink-0 border-t border-neutral-200/80 bg-white px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {config.showQuickRow ? (
        <FieldIconButtonRow className="mb-3" data-testid="mission-action-quick-row">
          {phone ? (
            <FieldIconButton
              href={`tel:${phone}`}
              testId="mission-action-call"
              label={t("common.call")}
              icon={<Phone className="h-6 w-6" />}
            />
          ) : null}
          {email ? (
            <FieldIconButton
              href={`mailto:${email}`}
              testId="mission-action-email"
              label="Mail"
              icon={<Mail className="h-6 w-6" />}
            />
          ) : null}
          {mapsUrl ? (
            <FieldIconButton
              href={mapsUrl}
              testId="mission-action-navigate"
              label={t("common.navigate")}
              icon={<Navigation2 className="h-6 w-6" />}
            />
          ) : null}
          {config.canMaterials && onOpenMaterials ? (
            <FieldIconButton
              testId="mission-action-materials"
              label={t("common.materials")}
              onClick={onOpenMaterials}
              icon={<Package className="h-6 w-6" />}
            />
          ) : null}
          {intervention.status === "in_progress" && onWaitingMaterial ? (
            <FieldIconButton
              testId="technician-waiting-material-btn"
              label={t("technician_hub.dashboard.detail.waiting_material")}
              disabled={isUpdating}
              onClick={onWaitingMaterial}
              icon={<Clock className="h-6 w-6" />}
            />
          ) : null}
          {intervention.status === "in_progress" && onQuickPhoto ? (
            <FieldIconButton
              testId="mission-action-photo"
              label={t("technician_hub.mission_action.photo")}
              onClick={onQuickPhoto}
              icon={<Camera className="h-6 w-6" />}
            />
          ) : null}
        </FieldIconButtonRow>
      ) : null}

      {config.primary?.kind === "finish" ? (
        <button
          type="button"
          data-testid="mission-action-primary-finish"
          disabled={isUpdating}
          onClick={onFinish}
          aria-label={t(config.primary.labelKey)}
          className={cn(
            "flex h-[66px] w-full items-center justify-center rounded-2xl bg-[#0F172A] text-white transition active:scale-[0.98] disabled:opacity-50",
          )}
        >
          <Camera className="h-7 w-7" />
        </button>
      ) : config.primary?.kind === "transition" ? (
        <SlideAction
          testId={config.primary.testId}
          label={slideLabel}
          icon={slideIcon}
          disabled={isUpdating}
          variant="field"
          compact={compact}
          onAction={handleTransition}
        />
      ) : null}
    </div>
  );
}
