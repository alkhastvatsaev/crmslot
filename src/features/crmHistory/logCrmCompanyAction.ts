import { firestore } from "@/core/config/firebase";
import type { Intervention } from "@/features/interventions/types";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";
import {
  buildCompanyCrmActivityPayload,
  logCompanyCrmActivity,
  type CompanyCrmActivityKind,
} from "./crmActivityLog";

export async function logCrmCompanyAction(params: {
  companyId: string;
  kind: CompanyCrmActivityKind;
  actorUid: string;
  actorRole: WorkflowOwnerRole;
  intervention?: Pick<
    Intervention,
    | "id"
    | "title"
    | "status"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientCompanyName"
    | "address"
  > | null;
  interventionId?: string;
  note?: string;
  statusBefore?: Intervention["status"];
  statusAfter?: Intervention["status"];
}): Promise<void> {
  const companyId = params.companyId.trim();
  if (!companyId || !firestore) return;

  const iv =
    params.intervention ??
    ({
      id: params.interventionId ?? "unknown",
      title: "",
      address: "",
      time: "",
      status: params.statusAfter ?? "pending",
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
    },
  );

  if (params.interventionId && !params.intervention) {
    payload.interventionId = params.interventionId;
  }

  try {
    await logCompanyCrmActivity(firestore, payload);
  } catch (e) {
    console.warn("[logCrmCompanyAction]", params.kind, e);
  }
}
