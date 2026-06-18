"use client";

import type { Intervention } from "@/features/interventions/types";
import {
  interventionClientLabel,
  formatScheduledTimeOnly,
} from "@/features/interventions/technicianSchedule";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";
import { interventionDescriptionText } from "@/features/interventions/interventionDescriptionText";
import { buildGoogleMapsDirectionsUrl } from "@/features/interventions/buildMissionContactActions";

export type TechnicianMissionPresentation = {
  clientDisplayName: string;
  timeLabel: string;
  address: string | null;
  addressMapsHref: string | null;
  descriptionText: string | null;
  shortClientLabel: string;
};

/** Libellés affichés sur l’écran mission mobile (gros texte, peu de bruit). */
export function buildTechnicianMissionPresentation(
  iv: Intervention,
  t: (key: string) => string
): TechnicianMissionPresentation {
  let firstName = iv.clientFirstName;
  let lastName = iv.clientLastName;
  if (!firstName && !lastName && iv.clientName) {
    const parts = iv.clientName.trim().split(" ");
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  const clientDisplayName =
    capitalizeName([firstName, lastName].filter(Boolean).join(" ").trim()) ||
    capitalizeName(iv.clientName ?? "") ||
    String(t("technician_hub.dashboard.detail.not_provided"));

  const shortClientLabel =
    capitalizeName(firstName ?? "") ||
    interventionClientLabel(iv).split(" ")[0] ||
    clientDisplayName;

  return {
    clientDisplayName,
    shortClientLabel,
    timeLabel: formatScheduledTimeOnly(iv),
    address: iv.address ? formatAddress(iv.address) : null,
    addressMapsHref: buildGoogleMapsDirectionsUrl(iv.address),
    descriptionText: interventionDescriptionText(iv),
  };
}
