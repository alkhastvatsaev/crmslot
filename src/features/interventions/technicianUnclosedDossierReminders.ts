import type { Intervention } from "@/features/interventions/types";
import {
  getTechnicianUnclosedInterventions,
  isTechnicianInterventionUnclosed,
} from "@/features/interventions/technicianClosureBlock";

export const UNCLOSED_DOSSIER_PUSH_TYPE = "unclosed_dossier";

/** Intervalle minimum entre deux push « dossier ouvert » pour un même technicien. */
export const UNCLOSED_DOSSIER_REMINDER_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const UNCLOSED_DOSSIER_ACTIVE_STATUSES: Intervention["status"][] = [
  "assigned",
  "en_route",
  "in_progress",
  "waiting_material",
];

export type UnclosedDossierReminderCandidate = {
  technicianUid: string;
  companyId: string;
  unclosed: Intervention[];
  primary: Intervention;
};

function interventionClientLabel(
  iv: Pick<Intervention, "clientFirstName" | "clientLastName" | "clientName">
): string {
  const parts = [iv.clientFirstName, iv.clientLastName]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return (iv.clientName ?? "").trim() || "Client";
}

export function groupUnclosedInterventionsByTechnician(
  rows: Intervention[]
): Map<string, Intervention[]> {
  const map = new Map<string, Intervention[]>();
  for (const iv of rows) {
    const uid = (iv.assignedTechnicianUid ?? "").trim();
    if (!uid || !isTechnicianInterventionUnclosed(iv, uid)) continue;
    const list = map.get(uid) ?? [];
    list.push(iv);
    map.set(uid, list);
  }
  return map;
}

/** Mission la plus ancienne à traiter en priorité (rappel + deep link). */
export function pickPrimaryUnclosedIntervention(rows: Intervention[]): Intervention {
  const sortKey = (iv: Intervention) => {
    const assignedAt = (iv as Intervention & { assignedAt?: string | null }).assignedAt;
    return (assignedAt ?? iv.statusUpdatedAt ?? iv.id).toString();
  };
  return [...rows].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))[0];
}

export function shouldSendUnclosedDossierReminder(
  lastSentAt: string | null | undefined,
  now = new Date(),
  minIntervalMs = UNCLOSED_DOSSIER_REMINDER_MIN_INTERVAL_MS
): boolean {
  const raw = (lastSentAt ?? "").trim();
  if (!raw) return true;
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return true;
  return now.getTime() - t >= minIntervalMs;
}

export function buildUnclosedDossierPushMessage(
  unclosed: Intervention[],
  primary: Intervention
): { title: string; body: string } {
  const label = interventionClientLabel(primary);
  const count = unclosed.length;
  if (count <= 1) {
    return {
      title: "Mission à clôturer",
      body: `${label} — terminez la clôture avant une nouvelle mission.`,
    };
  }
  return {
    title: `${count} missions à clôturer`,
    body: `${label} et ${count - 1} autre(s) — terminez vos clôtures terrain.`,
  };
}

export function toUnclosedDossierReminderCandidates(
  rows: Intervention[]
): UnclosedDossierReminderCandidate[] {
  const grouped = groupUnclosedInterventionsByTechnician(rows);
  const candidates: UnclosedDossierReminderCandidate[] = [];

  for (const [technicianUid, assignedRows] of grouped) {
    const unclosed = getTechnicianUnclosedInterventions(assignedRows, technicianUid);
    if (unclosed.length === 0) continue;
    const primary = pickPrimaryUnclosedIntervention(unclosed);
    const companyId = (primary.companyId ?? "").trim();
    if (!companyId) continue;
    candidates.push({ technicianUid, companyId, unclosed, primary });
  }

  return candidates;
}
