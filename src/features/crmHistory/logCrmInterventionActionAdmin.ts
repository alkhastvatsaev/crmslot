import { getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";
import { buildCompanyCrmActivityPayload, type CompanyCrmActivityKind } from "./crmActivityLog";
import { logCompanyCrmActivityAdmin } from "./logCompanyCrmActivityAdmin";

/** Journal CRM côté serveur (webhooks, Admin SDK). */
export async function logCrmInterventionActionAdmin(params: {
  kind: CompanyCrmActivityKind;
  iv: Pick<
    Intervention,
    | "id"
    | "title"
    | "address"
    | "status"
    | "companyId"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientCompanyName"
  >;
  actorUid: string;
  actorRole: WorkflowOwnerRole;
  note?: string;
  statusBefore?: Intervention["status"];
  statusAfter?: Intervention["status"];
}): Promise<void> {
  const companyId = (params.iv.companyId ?? "").trim();
  if (!companyId) return;

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
    await logCompanyCrmActivityAdmin(getAdminDb(), payload);
  } catch (e) {
    logger.warn("[logCrmInterventionActionAdmin]", {
      kind: params.kind,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
