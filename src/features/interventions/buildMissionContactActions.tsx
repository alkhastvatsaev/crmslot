import { Camera, Clock, Mail, MessageSquare, Navigation2, Package, Phone } from "lucide-react";
import type { Intervention } from "@/features/interventions/types";
import type { MissionContactAction } from "@/features/interventions/components/MissionContactRail";
import { resolveMissionActionBar } from "@/features/interventions/missionActionBar";
import { formatAddress } from "@/utils/stringUtils";

const ICON = "h-[1.125rem] w-[1.125rem]";
const FIELD_ICON = "h-6 w-6";

export function buildGoogleMapsDirectionsUrl(address: string | null | undefined): string | null {
  const raw = (address ?? "").trim();
  if (!raw) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(raw))}`;
}

export type BuildMissionContactActionsParams = {
  intervention: Pick<Intervention, "status" | "clientPhone" | "phone" | "address" | "clientEmail">;
  t: (key: string) => string;
  awaitingAssignment?: boolean;
  isUpdating?: boolean;
  onOpenMaterials?: () => void;
  onWaitingMaterial?: () => void;
  onQuickPhoto?: () => void;
  /** Terrain : appel / SMS / GPS seulement (pas de mail — réservé au back-office). */
  primaryOnly?: boolean;
};

export function buildMissionContactActions({
  intervention,
  t,
  awaitingAssignment = false,
  isUpdating = false,
  onOpenMaterials,
  onWaitingMaterial,
  onQuickPhoto,
  primaryOnly = false,
}: BuildMissionContactActionsParams): MissionContactAction[] {
  const config = resolveMissionActionBar(intervention, { awaitingAssignment });
  const phone = intervention.clientPhone || intervention.phone;
  const mapsUrl = buildGoogleMapsDirectionsUrl(intervention.address);
  const iconClass = primaryOnly ? FIELD_ICON : ICON;

  const actions: MissionContactAction[] = [];

  if (phone) {
    actions.push({
      key: "call",
      label: t("common.call"),
      testId: "mission-action-call",
      href: `tel:${phone}`,
      tone: "call",
      icon: <Phone className={iconClass} strokeWidth={2.25} />,
    });
    if (primaryOnly) {
      actions.push({
        key: "sms",
        label: t("common.sms"),
        testId: "mission-action-sms",
        href: `sms:${phone}`,
        tone: "sms",
        icon: <MessageSquare className={iconClass} strokeWidth={2.25} />,
      });
    }
  }
  if (mapsUrl) {
    actions.push({
      key: "nav",
      label: t("common.navigate"),
      testId: "mission-action-navigate",
      href: mapsUrl,
      tone: "nav",
      icon: <Navigation2 className={iconClass} strokeWidth={2.25} />,
    });
  }

  if (primaryOnly) return actions;

  const email = intervention.clientEmail;
  if (email) {
    actions.push({
      key: "email",
      label: "Mail",
      testId: "mission-action-email",
      href: `mailto:${email}`,
      tone: "email",
      icon: <Mail className={ICON} strokeWidth={2.25} />,
    });
  }

  if (config.canMaterials && onOpenMaterials) {
    actions.push({
      key: "materials",
      label: t("common.materials"),
      testId: "mission-action-materials",
      onClick: onOpenMaterials,
      tone: "neutral",
      icon: <Package className={ICON} strokeWidth={2.25} />,
    });
  }
  if (intervention.status === "in_progress" && onWaitingMaterial) {
    actions.push({
      key: "waiting",
      label: t("technician_hub.dashboard.detail.waiting_material"),
      testId: "technician-waiting-material-btn",
      onClick: onWaitingMaterial,
      disabled: isUpdating,
      tone: "neutral",
      icon: <Clock className={ICON} strokeWidth={2.25} />,
    });
  }
  if (intervention.status === "in_progress" && onQuickPhoto) {
    actions.push({
      key: "photo",
      label: t("technician_hub.dashboard.mission_action.photo"),
      testId: "mission-action-photo",
      onClick: onQuickPhoto,
      tone: "neutral",
      icon: <Camera className={ICON} strokeWidth={2.25} />,
    });
  }

  return actions;
}
