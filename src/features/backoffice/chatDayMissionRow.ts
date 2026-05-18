import { missionStableKey } from "@/features/map/missionStableKey";
import type { Intervention } from "@/features/interventions/types";
import {
  formatScheduledTimeOnly,
  interventionClientLabel,
} from "@/features/interventions/technicianSchedule";
import type { Mission } from "@/utils/mockMissions";

/** Une ligne « client du jour » pour le picker chat (aligné rail missions). */
export type ChatDayMissionRow = {
  threadId: string;
  clientName: string;
  time: string;
  address?: string | null;
  statusCode?: Intervention["status"];
  /** Libellé affiché si pas de code métier (missions démo). */
  statusLabel?: string;
};

export function missionsToChatDayRows(missions: Mission[]): ChatDayMissionRow[] {
  return missions.map((m) => ({
    threadId: missionStableKey(m),
    clientName: m.clientName,
    time: m.time,
    address: m.address,
    statusCode: m.statusCode,
    statusLabel: m.status,
  }));
}

export function interventionsToChatDayRows(interventions: Intervention[]): ChatDayMissionRow[] {
  return interventions.map((iv) => ({
    threadId: iv.id,
    clientName: interventionClientLabel(iv) || iv.clientCompanyName?.trim() || iv.clientName?.trim() || "",
    time: formatScheduledTimeOnly(iv),
    address: iv.address,
    statusCode: iv.status,
  }));
}
