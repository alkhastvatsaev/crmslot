import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";
import {
  buildCompanyCrmActivityPayload,
  logCompanyCrmActivity,
  type CompanyCrmActivityKind,
} from "./crmActivityLog";

type CrmLoggableContext = {
  id: string;
  title?: string | null;
  status?: string | null;
  clientName?: string | null;
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientCompanyName?: string | null;
  address?: string | null;
};

export async function logCrmCompanyAction(params: {
  companyId: string;
  kind: CompanyCrmActivityKind;
  actorUid: string;
  actorRole: WorkflowOwnerRole;
  intervention?: CrmLoggableContext | null;
  interventionId?: string;
  note?: string;
  statusBefore?: string;
  statusAfter?: string;
}): Promise<void> {
  const companyId = params.companyId.trim();
  if (!companyId || !firestore) return;

  const iv: Intervention = params.intervention
    ? ({
        ...params.intervention,
        time: "",
        location: { lat: 0, lng: 0 },
        status: (params.intervention.status ??
          params.statusAfter ??
          "pending") as Intervention["status"],
      } as Intervention)
    : ({
        id: params.interventionId ?? "unknown",
        title: "",
        address: "",
        time: "",
        status: (params.statusAfter ?? "pending") as Intervention["status"],
        location: { lat: 0, lng: 0 },
      } as Intervention);

  const payload = buildCompanyCrmActivityPayload(
    companyId,
    params.kind,
    { uid: params.actorUid, role: params.actorRole },
    iv,
    {
      statusBefore: params.statusBefore,
      statusAfter: params.statusAfter,
      note: params.note,
    }
  );

  if (params.interventionId && !params.intervention) {
    payload.interventionId = params.interventionId;
  }

  try {
    await logCompanyCrmActivity(firestore, payload);
  } catch (e) {
    logger.warn("[logCrmCompanyAction]", {
      kind: params.kind,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
