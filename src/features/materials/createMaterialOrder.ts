import type { Firestore } from "firebase/firestore";
import type { Intervention } from "@/features/interventions/types";
import type { MaterialOrder, MaterialOrderPart } from "@/features/materials/types";
import { createMaterialOrderDoc } from "@/features/materials/materialOrderFirestore";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import type { TransitionActor } from "@/features/interventions/workflow/interventionWorkflowTypes";

export type CreateMaterialOrderParams = {
  db: Firestore;
  intervention: Pick<Intervention, "id" | "status" | "companyId" | "assignedTechnicianUid" | "createdByUid">;
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

  const orderId = await createMaterialOrderDoc(db, {
    interventionId: intervention.id,
    companyId: intervention.companyId ?? null,
    technicianUid,
    partsRequested,
    urgency,
  });

  const summary = partsRequested.map((p) => `${p.quantity}× ${p.description}`).join("; ");

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
