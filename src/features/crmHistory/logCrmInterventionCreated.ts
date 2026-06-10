import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import type { Intervention } from "@/features/interventions/types";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";
import { buildCompanyCrmActivityPayload, logCompanyCrmActivity } from "./crmActivityLog";

export type InterventionCreatedSource =
  | "hub_smart_form"
  | "hub_requester_panel"
  | "widget_qr"
  | "map_transcription"
  | "recurring_contract";

export async function logCrmInterventionCreated(params: {
  intervention: Pick<
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
  source: InterventionCreatedSource;
}): Promise<void> {
  const companyId = (params.intervention.companyId ?? "").trim();
  if (!companyId || !firestore) return;

  const sourceLabels: Record<InterventionCreatedSource, string> = {
    hub_smart_form: "Formulaire hub (Que faut-il réparer ?)",
    hub_requester_panel: "Portail demandeur",
    widget_qr: "Widget QR / formulaire public",
    map_transcription: "Carte — transcription audio",
    recurring_contract: "Contrat récurrent",
  };

  const payload = buildCompanyCrmActivityPayload(
    companyId,
    "intervention_created",
    { uid: params.actorUid, role: params.actorRole },
    { ...params.intervention, status: params.intervention.status ?? "pending" },
    {
      statusAfter: "pending",
      note: sourceLabels[params.source],
    }
  );

  try {
    await logCompanyCrmActivity(firestore, payload);
  } catch (e) {
    logger.warn("[logCrmInterventionCreated]", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
