import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";
import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
import { missionStableKey } from "@/features/map/missionStableKey";
import type { Intervention } from "@/features/interventions";
import {
  formatScheduledTimeOnly,
  interventionClientLabel,
  interventionMatchesTab,
  isInterventionReleasedToTechnicianField,
} from "@/features/interventions/technicianSchedule";
import type { Mission } from "@/features/map";
import { sortChatDayRows } from "@/features/backoffice/portalChatInboxLogic";

/** Une ligne client pour le picker chat (jour en tête, puis historique). */
export type ChatDayMissionRow = {
  threadId: string;
  clientName: string;
  time: string;
  address?: string | null;
  statusCode?: Intervention["status"];
  /** Libellé affiché si pas de code métier (missions démo). */
  statusLabel?: string;
  /** Créneau du jour sélectionné (affiché en tête de liste). */
  isToday?: boolean;
  /** Dernier message du fil = client (en attente de réponse staff). */
  needsReply?: boolean;
};

export function missionsToChatDayRows(missions: Mission[]): ChatDayMissionRow[] {
  return missions.map((m) => ({
    threadId: missionStableKey(m),
    clientName: m.clientName,
    time: m.time,
    address: m.address,
    statusCode: m.statusCode,
    statusLabel: m.status,
    isToday: true,
  }));
}

export function interventionsToChatDayRows(
  interventions: Intervention[],
  selectedDate: Date
): ChatDayMissionRow[] {
  return interventions.map((iv) => ({
    threadId: iv.id,
    clientName:
      interventionClientLabel(iv) || iv.clientCompanyName?.trim() || iv.clientName?.trim() || "",
    time: formatScheduledTimeOnly(iv),
    address: iv.address,
    statusCode: iv.status,
    isToday: interventionMatchesTab(iv, "today", selectedDate),
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
  /** Dossiers avec messages client portail — visibles même hors créneau « jour ». */
  includeInterventionIds?: string[];
};

/** Lignes chat — tous les dossiers société, créneau « jour » en tête. */
export function buildChatDayRows({
  interventions,
  dayMissions,
  selectedDate = new Date(),
  workspace,
  mapDispatchFilter = false,
  includeInterventionIds = [],
}: BuildChatDayRowsInput): ChatDayMissionRow[] {
  const isDispatchMap = isCompanyDispatchViewer(workspace);

  const byThread = new Map<string, ChatDayMissionRow>();

  for (const iv of interventions) {
    if (iv.status === "cancelled") continue;
    const isToday = interventionMatchesTab(iv, "today", selectedDate);
    if (
      mapDispatchFilter &&
      isDispatchMap &&
      isToday &&
      !isInterventionReleasedToTechnicianField(iv)
    ) {
      continue;
    }
    byThread.set(iv.id, {
      threadId: iv.id,
      clientName:
        interventionClientLabel(iv) || iv.clientCompanyName?.trim() || iv.clientName?.trim() || "",
      time: formatScheduledTimeOnly(iv),
      address: iv.address,
      statusCode: iv.status,
      isToday,
    });
  }

  if (dayMissions) {
    for (const row of missionsToChatDayRows(dayMissions)) {
      if (!byThread.has(row.threadId)) byThread.set(row.threadId, row);
    }
  }

  for (const ivId of includeInterventionIds) {
    const trimmed = ivId.trim();
    if (!trimmed || byThread.has(trimmed)) continue;
    const iv = interventions.find((x) => x.id === trimmed);
    if (iv) {
      byThread.set(trimmed, {
        threadId: iv.id,
        clientName:
          interventionClientLabel(iv) ||
          iv.clientCompanyName?.trim() ||
          iv.clientName?.trim() ||
          "",
        time: formatScheduledTimeOnly(iv),
        address: iv.address,
        statusCode: iv.status,
        isToday: interventionMatchesTab(iv, "today", selectedDate),
      });
    } else {
      byThread.set(trimmed, {
        threadId: trimmed,
        clientName: "",
        time: "",
        isToday: false,
      });
    }
  }

  return sortChatDayRows([...byThread.values()], selectedDate);
}
