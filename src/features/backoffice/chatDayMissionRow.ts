import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";
import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
import { missionStableKey } from "@/features/map/missionStableKey";
import type { Intervention } from "@/features/interventions/types";
import {
  formatScheduledTimeOnly,
  interventionClientLabel,
  interventionMatchesTab,
  isInterventionReleasedToTechnicianField,
} from "@/features/interventions/technicianSchedule";
import type { Mission } from "@/features/map/missionTypes";

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
    clientName:
      interventionClientLabel(iv) || iv.clientCompanyName?.trim() || iv.clientName?.trim() || "",
    time: formatScheduledTimeOnly(iv),
    address: iv.address,
    statusCode: iv.status,
  }));
}

type BuildChatDayRowsInput = {
  interventions: Intervention[];
  dayMissions?: Mission[];
  selectedDate?: Date;
  workspace?: Pick<CompanyWorkspaceApi, "isTenantUser" | "activeRole"> | null | undefined;
  /**
   * Filtre carte dispatch (missions avec coords) — pas pour le picker chat admin :
   * inclut aussi les demandes en attente de validation.
   */
  mapDispatchFilter?: boolean;
};

/** Lignes chat du jour — interventions Firestore + missions locales carte (démo). */
export function buildChatDayRows({
  interventions,
  dayMissions,
  selectedDate = new Date(),
  workspace,
  mapDispatchFilter = false,
}: BuildChatDayRowsInput): ChatDayMissionRow[] {
  const isDispatchMap = isCompanyDispatchViewer(workspace);
  const ivs = interventions.filter((iv) => {
    if (!interventionMatchesTab(iv, "today", selectedDate)) return false;
    if (mapDispatchFilter && isDispatchMap && !isInterventionReleasedToTechnicianField(iv)) {
      return false;
    }
    return iv.status !== "cancelled";
  });

  const byThread = new Map<string, ChatDayMissionRow>();
  for (const row of interventionsToChatDayRows(ivs)) {
    byThread.set(row.threadId, row);
  }
  if (dayMissions) {
    for (const row of missionsToChatDayRows(dayMissions)) {
      if (!byThread.has(row.threadId)) byThread.set(row.threadId, row);
    }
  }
  return [...byThread.values()];
}
