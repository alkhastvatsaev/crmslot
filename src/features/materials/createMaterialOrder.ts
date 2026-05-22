import type { Firestore } from "firebase/firestore";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";
import type { Intervention } from "@/features/interventions/types";
import type { MaterialOrder, MaterialOrderPart } from "@/features/materials/types";
import { createMaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import type { TransitionActor } from "@/features/interventions/workflow/interventionWorkflowTypes";
import { logCrmCompanyAction } from "@/features/crmHistory/logCrmCompanyAction";

export type CreateMaterialOrderParams = {
  db: Firestore;
  intervention: Pick<
    Intervention,
    | "id"
    | "status"
    | "companyId"
    | "assignedTechnicianUid"
    | "createdByUid"
    | "clientFirstName"
    | "clientLastName"
    | "clientName"
    | "clientCompanyName"
    | "title"
  >;
  technicianUid: string;
  partsRequested: MaterialOrderPart[];
  urgency: MaterialOrder["urgency"];
  actor: TransitionActor;
  /** Passe le dossier en `waiting_material` si encore en cours. */
  setWaitingMaterial?: boolean;
};

export async function createMaterialOrder(params: CreateMaterialOrderParams): Promise<string> {
  const {
    db,
    intervention,
    technicianUid,
    partsRequested,
    urgency,
    actor,
    setWaitingMaterial = true,
  } = params;

  const clientName = resolveInterventionClientName(intervention);

  const orderId = await createMaterialOrderDoc(db, {
    interventionId: intervention.id,
    companyId: intervention.companyId ?? null,
    clientName,
    technicianUid,
    partsRequested,
    urgency,
  });

  const summary = partsRequested.map((p) => `${p.quantity}× ${p.description}`).join("; ");

  if (intervention.companyId) {
    void logCrmCompanyAction({
      companyId: intervention.companyId,
      kind: "material_order_placed",
      actorUid: actor.uid,
      actorRole: actor.role,
      intervention: {
        id: intervention.id,
        title: intervention.title ?? "Dossier",
        status: intervention.status,
        clientName: clientName || intervention.clientName,
        clientFirstName: intervention.clientFirstName ?? null,
        clientLastName: intervention.clientLastName ?? null,
        clientCompanyName: intervention.clientCompanyName ?? null,
        address: "",
      },
      note: `Demande matériel terrain · ${summary.slice(0, 240)}`,
    });
  }

  if (
    setWaitingMaterial &&
    intervention.status === "in_progress" &&
    partsRequested.length > 0
  ) {
    await transitionInterventionStatus({
      db,
      interventionId: intervention.id,
      iv: intervention,
      toStatus: "waiting_material",
      actor,
      note: `Commande matériel : ${summary.slice(0, 500)}`,
    });
  }

  return orderId;
}
