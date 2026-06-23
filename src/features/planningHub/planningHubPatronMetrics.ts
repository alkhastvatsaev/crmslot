import type { Intervention } from "@/features/interventions";
import { localCalendarYmd } from "@/features/interventions/technicianSchedule";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";
import type {
  PlanningHubSlot,
  PlanningPendingRow,
  PlanningTechnicianRow,
} from "@/features/planningHub/planningHubTypes";

export type PlanningHubKpis = {
  missionsToday: number;
  conflictCount: number;
  unassignedToday: number;
};

export const PLANNING_WORK_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

const ACTIVE_STATUSES = new Set<Intervention["status"]>([
  "assigned",
  "en_route",
  "in_progress",
  "waiting_material",
]);

function normalizeHourBucket(time: string | null | undefined): string | null {
  if (!time?.trim()) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!m) return null;
  return `${String(Number(m[1])).padStart(2, "0")}:00`;
}

function resolveInterventionYmd(iv: Intervention): string | null {
  return iv.scheduledDate?.trim() || iv.requestedDate?.trim() || null;
}

function resolveInterventionTime(iv: Intervention): string | null {
  return (
    normalizeHourBucket(iv.scheduledTime) ??
    normalizeHourBucket(iv.requestedTime) ??
    normalizeHourBucket(iv.time)
  );
}

function interventionsForDay(interventions: Intervention[], ymd: string): Intervention[] {
  return interventions.filter((iv) => {
    const d = resolveInterventionYmd(iv);
    if (d !== ymd) return false;
    const status = iv.status ?? "pending";
    return status !== "cancelled";
  });
}

export function buildPlanningHubKpis(params: {
  interventions: Intervention[];
  now?: Date;
}): PlanningHubKpis {
  const now = params.now ?? new Date();
  const todayYmd = localCalendarYmd(now);
  const today = interventionsForDay(params.interventions, todayYmd);

  let conflictCount = 0;
  const byTechHour = new Map<string, number>();

  for (const iv of today) {
    const uid = (iv.assignedTechnicianUid ?? "").trim();
    const hour = resolveInterventionTime(iv);
    if (!uid || !hour) continue;
    const key = `${uid}|${hour}`;
    const n = (byTechHour.get(key) ?? 0) + 1;
    byTechHour.set(key, n);
    if (n === 2) conflictCount += 1;
  }

  const unassignedToday = today.filter(
    (iv) =>
      !(iv.assignedTechnicianUid ?? "").trim() &&
      !["done", "invoiced", "cancelled"].includes(iv.status ?? "pending")
  ).length;

  const missionsToday = today.filter((iv) => ACTIVE_STATUSES.has(iv.status ?? "pending")).length;

  return { missionsToday, conflictCount, unassignedToday };
}

export function buildPlanningTechnicianRows(params: {
  interventions: Intervention[];
  technicians: { id: string; name: string; initial: string; authUid?: string | null }[];
  now?: Date;
}): PlanningTechnicianRow[] {
  const now = params.now ?? new Date();
  const todayYmd = localCalendarYmd(now);
  const today = interventionsForDay(params.interventions, todayYmd);

  const missionCountByUid = new Map<string, number>();
  const onMission = new Set<string>();

  for (const iv of today) {
    const uid = (iv.assignedTechnicianUid ?? "").trim();
    if (!uid) continue;
    missionCountByUid.set(uid, (missionCountByUid.get(uid) ?? 0) + 1);
    if (ACTIVE_STATUSES.has(iv.status ?? "pending")) onMission.add(uid);
  }

  return params.technicians
    .map((tech) => {
      const uid = (tech.authUid ?? tech.id).trim();
      const missionCount = missionCountByUid.get(uid) ?? 0;
      return {
        uid,
        name: tech.name,
        initial: tech.initial,
        missionCount,
        status: onMission.has(uid)
          ? ("on-mission" as const)
          : missionCount > 0
            ? ("available" as const)
            : ("idle" as const),
      };
    })
    .sort((a, b) => b.missionCount - a.missionCount);
}

export function buildPlanningSlotsForTechnician(params: {
  interventions: Intervention[];
  technicianUid: string;
  now?: Date;
}): PlanningHubSlot[] {
  const now = params.now ?? new Date();
  const todayYmd = localCalendarYmd(now);
  const uid = params.technicianUid.trim();

  const byHour = new Map<string, Intervention[]>();
  for (const iv of interventionsForDay(params.interventions, todayYmd)) {
    if ((iv.assignedTechnicianUid ?? "").trim() !== uid) continue;
    const hour = resolveInterventionTime(iv);
    if (!hour || !PLANNING_WORK_SLOTS.includes(hour as (typeof PLANNING_WORK_SLOTS)[number])) {
      continue;
    }
    const list = byHour.get(hour) ?? [];
    list.push(iv);
    byHour.set(hour, list);
  }

  return PLANNING_WORK_SLOTS.map((time) => {
    const list = byHour.get(time) ?? [];
    if (list.length === 0) {
      return { time, label: "Libre", kind: "free" as const };
    }
    if (list.length > 1) {
      return {
        time,
        label: `${list.length} missions`,
        kind: "conflict" as const,
        interventionId: list[0]!.id,
      };
    }
    const iv = list[0]!;
    const label = resolveInterventionClientName(iv) || iv.title || iv.id.slice(-6);
    return { time, label, kind: "busy" as const, interventionId: iv.id };
  });
}

export function buildPlanningPendingRows(params: {
  interventions: Intervention[];
  now?: Date;
}): PlanningPendingRow[] {
  const now = params.now ?? new Date();
  const todayYmd = localCalendarYmd(now);

  return interventionsForDay(params.interventions, todayYmd)
    .filter((iv) => {
      const status = iv.status ?? "pending";
      if (["done", "invoiced", "cancelled"].includes(status)) return false;
      const uid = (iv.assignedTechnicianUid ?? "").trim();
      if (!uid) return true;
      return status === "assigned" && !iv.technicianAcceptedAt;
    })
    .map((iv) => {
      const clientLabel = resolveInterventionClientName(iv) || iv.title || iv.id.slice(-6);
      const date = resolveInterventionYmd(iv) ?? todayYmd;
      const time = iv.scheduledTime ?? iv.requestedTime ?? "—";
      const uid = (iv.assignedTechnicianUid ?? "").trim();
      return {
        id: iv.id,
        clientLabel,
        slotLabel: `${date} · ${time}`,
        state: uid ? ("awaiting_accept" as const) : ("unassigned" as const),
      };
    });
}

export function findInterventionById(
  interventions: Intervention[],
  id: string | null | undefined
): Intervention | null {
  if (!id) return null;
  return interventions.find((iv) => iv.id === id) ?? null;
}
