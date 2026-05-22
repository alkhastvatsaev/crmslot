import * as admin from "firebase-admin";

export type CrmActivityKind =
  | "intervention_invoiced"
  | "intervention_payment_updated"
  | "intervention_billing_updated";

export async function logCompanyCrmActivityAdmin(
  companyId: string,
  payload: {
    kind: CrmActivityKind;
    at: string;
    actorUid: string;
    actorRole: "dispatcher" | "technician" | "client" | "system";
    interventionId?: string | null;
    interventionTitle?: string | null;
    clientName?: string | null;
    address?: string | null;
    statusBefore?: string | null;
    statusAfter?: string | null;
    note?: string | null;
  },
): Promise<void> {
  const cid = companyId.trim();
  if (!cid) return;
  await admin
    .firestore()
    .collection("companies")
    .doc(cid)
    .collection("crm_activity")
    .add({
      companyId: cid,
      ...payload,
    });
}
