import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions";
import {
  buildCompanyCrmActivityPayload,
  logCompanyCrmActivity,
} from "@/features/crmHistory/crmActivityLog";
import type { TimeEntryType } from "@/features/timetracking/types";
import { buildTimeEntryCrmNote } from "@/features/timetracking/timeEntryMissionAutomation";

/** Journalise un pointage clôturé dans Quality Management (`crm_activity`). */
export async function logCrmTimeEntryRecorded(params: {
  iv: Pick<
    Intervention,
    | "id"
    | "title"
    | "status"
    | "companyId"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientCompanyName"
    | "address"
  >;
  actorUid: string;
  entryType: TimeEntryType;
  durationMinutes: number;
}): Promise<void> {
  const companyId = (params.iv.companyId ?? "").trim();
  if (!companyId || !firestore || params.durationMinutes <= 0) return;

  const note = buildTimeEntryCrmNote(params.entryType, params.durationMinutes);
  const payload = buildCompanyCrmActivityPayload(
    companyId,
    "time_entry_recorded",
    { uid: params.actorUid, role: "technician" },
    params.iv,
    { note, statusBefore: params.iv.status, statusAfter: params.iv.status }
  );

  try {
    await logCompanyCrmActivity(firestore, payload);
  } catch (e) {
    logger.warn("[logCrmTimeEntryRecorded]", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
