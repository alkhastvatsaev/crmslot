/**
 * Évènements timeline d'une intervention (sous-collection
 * `interventions/{id}/timeline`).
 *
 * Distinct de `InterventionStatusEvent` (workflow/interventionWorkflowTypes.ts)
 * qui modélise une transition de statut au sens machine d'états.
 */
export interface InterventionEvent {
  id: string;
  interventionId: string;
  type: "status_change" | "comment" | "email" | "material_order" | "commission" | "portal_chat";
  createdAt: string;
  createdByUid: string;
  content?: string;
  oldStatus?: string;
  newStatus?: string;
  /** Notes internes vs visibles client (portail). */
  visibility?: "internal" | "client";
  actorRole?: string;
}
