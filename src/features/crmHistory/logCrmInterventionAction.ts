import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";
import {
  buildCompanyCrmActivityPayload,
  logCompanyCrmActivity,
  type CompanyCrmActivityKind,
} from "./crmActivityLog";

export type { CompanyCrmActivityKind };

export async function logCrmInterventionAction(params: {
  kind: CompanyCrmActivityKind;
  iv: Intervention;
  actorUid: string;
  actorRole: WorkflowOwnerRole;
  note?: string;
  statusBefore?: Intervention["status"];
  statusAfter?: Intervention["status"];
}): Promise<void> {
  const companyId = (params.iv.companyId ?? "").trim();
  if (!companyId || !firestore) return;

  const payload = buildCompanyCrmActivityPayload(
    companyId,
    params.kind,
    { uid: params.actorUid, role: params.actorRole },
    params.iv,
    {
      statusBefore: params.statusBefore ?? params.iv.status,
      statusAfter: params.statusAfter,
      note: params.note,
    }
  );

  try {
    await logCompanyCrmActivity(firestore, payload);
  } catch (e) {
    logger.warn("[logCrmInterventionAction]", {
      kind: params.kind,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
