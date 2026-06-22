import {
  interventionClientLabel,
  statusLabelKey,
  formatScheduledTimeOnly,
  interventionMatchesTab,
  interventionVisibleInTechnicianMissionList,
  isInterventionReleasedToTechnicianField,
  isInterventionVisibleOnTechnicianMap,
} from "@/features/interventions/technicianSchedule";
import type { Mission } from "@/features/map/missionTypes";
import type { Intervention } from "@/features/interventions/types";

export function interventionHasMapCoordinates(iv: Intervention): boolean {
  const loc = iv.location;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return false;
  return Number.isFinite(loc.lat) && Number.isFinite(loc.lng);
}

export function isValidMissionCoordinates(coords: [number, number]): boolean {
  const [lng, lat] = coords;
  return Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);
}

export function missionTimeSortScore(time: string): number {
  if (!time) return 9999;
  if (time === "Maintenant") return -1;
  const raw = time.trim();
  const last = raw.split(/\s+/).pop() || raw;
  const m = /^(\d{2}):(\d{2})$/.exec(last);
  if (!m) return 9999;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function interventionNumericId(interventionId: string): number {
  let numericId = 0;
  for (let i = 0; i < interventionId.length; i++) {
    numericId = (numericId << 5) - numericId + interventionId.charCodeAt(i);
    numericId |= 0;
  }
  return Math.abs(numericId);
}

type BuildMissionsArgs = {
  firestoreInterventions: Intervention[];
  liveMissions: Mission[];
  selectedDateStr: string;
  selectedDate: Date;
  isDispatchMap: boolean;
  technicianUid: string | null | undefined;
  clientLabel: (key: string) => string;
};

export function buildMapHubMissions({
  firestoreInterventions,
  liveMissions,
  selectedDateStr,
  selectedDate,
  isDispatchMap,
  technicianUid,
  clientLabel,
}: BuildMissionsArgs): Mission[] {
  const liveForDay = liveMissions.filter((m) => !m.date || m.date === selectedDateStr);

  const realMissions: Mission[] = firestoreInterventions
    .filter((iv) =>
      isDispatchMap
        ? isInterventionReleasedToTechnicianField(iv)
        : isInterventionVisibleOnTechnicianMap(iv)
    )
    .filter((iv) =>
      isDispatchMap
        ? interventionMatchesTab(iv, "today", selectedDate)
        : interventionVisibleInTechnicianMissionList(iv, "today", technicianUid, selectedDate)
    )
    .filter(interventionHasMapCoordinates)
    .map((iv) => ({
      id: interventionNumericId(iv.id),
      key: iv.id,
      clientName: interventionClientLabel(iv) || clientLabel("common.client"),
      coordinates: [iv.location.lng, iv.location.lat] as [number, number],
      time: formatScheduledTimeOnly(iv),
      status: clientLabel(statusLabelKey(iv.status)),
      statusCode: iv.status,
      source: "live" as const,
      date: iv.scheduledDate || selectedDateStr,
      phone: iv.clientPhone || iv.phone || undefined,
      address: iv.address || undefined,
      description: iv.problem || iv.transcription || undefined,
    }));

  const unique = new Map<string | number, Mission>();
  [...realMissions, ...liveForDay].forEach((m) => {
    const key = m.key ?? m.id;
    if (!unique.has(key)) unique.set(key, m);
  });

  return [...unique.values()].sort(
    (a, b) => missionTimeSortScore(a.time) - missionTimeSortScore(b.time)
  );
}

export function computeMapKpiCounts(visibleMissions: Mission[]) {
  return {
    pending: visibleMissions.filter((m) =>
      ["pending", "assigned", "pending_needs_address"].includes(m.statusCode ?? "")
    ).length,
    inProgress: visibleMissions.filter((m) =>
      ["en_route", "in_progress"].includes(m.statusCode ?? "")
    ).length,
    done: visibleMissions.filter((m) => ["done", "invoiced"].includes(m.statusCode ?? "")).length,
  };
}
