import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { getDefaultAssignedTechnicianUid } from "@/features/interventions/defaultAssignedTechnicianUid";
import type { Intervention, InterventionEvent } from "@/features/interventions/types";

export const BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID = "hub-example-preview";

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

export const BACK_OFFICE_HUB_EXAMPLE_INTERVENTION: Intervention = {
  id: BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID,
  title: "Ouverture porte claquée — bureau",
  address: "Avenue Louise 231, 1050 Bruxelles",
  time: "14:30",
  status: "done",
  location: { lat: 50.826, lng: 4.365 },
  clientName: "Dupont & Fils SA",
  clientPhone: "+32 2 640 12 34",
  category: "serrurerie",
  problem: "Porte bureau claquée, clé à l'intérieur. Accès confirmé après 14h.",
  companyId: DEMO_COMPANY_ID,
  assignedTechnicianUid: getDefaultAssignedTechnicianUid(),
  scheduledDate: new Date().toLocaleDateString("en-CA"),
  scheduledTime: "14:30",
  createdAt: hoursAgo(52),
  completedAt: hoursAgo(3),
  invoiceAmountCents: 18_500,
  commissionAmountCents: 2_775,
  paymentStatus: "paid",
  paidAt: hoursAgo(2),
  billingLines: [
    { description: "Ouverture porte claquée", quantity: 1, unitPriceCents: 12_000 },
    { description: "Déplacement Bruxelles", quantity: 1, unitPriceCents: 4_500 },
    { description: "Cylindre européen (fourniture)", quantity: 1, unitPriceCents: 2_000 },
  ],
};

export const BACK_OFFICE_HUB_EXAMPLE_TIMELINE_EVENTS: InterventionEvent[] = [
  {
    id: "ex-t1",
    interventionId: BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID,
    type: "status_change",
    createdAt: hoursAgo(48),
    createdByUid: "demo-dispatcher",
    oldStatus: "pending",
    newStatus: "assigned",
    actorRole: "dispatcher",
  },
  {
    id: "ex-t2",
    interventionId: BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID,
    type: "comment",
    createdAt: hoursAgo(36),
    createdByUid: "demo-dispatcher",
    content: "Client informé du créneau 14h30. Badge immeuble — sonnerie « Dupont ».",
    visibility: "internal",
    actorRole: "dispatcher",
  },
  {
    id: "ex-t3",
    interventionId: BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID,
    type: "status_change",
    createdAt: hoursAgo(8),
    createdByUid: getDefaultAssignedTechnicianUid(),
    oldStatus: "assigned",
    newStatus: "in_progress",
    actorRole: "technician",
  },
  {
    id: "ex-t4",
    interventionId: BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID,
    type: "material_order",
    createdAt: hoursAgo(6),
    createdByUid: getDefaultAssignedTechnicianUid(),
    content: "Commande cylindre européen 30/30 — urgence normale.",
    actorRole: "technician",
  },
  {
    id: "ex-t5",
    interventionId: BACK_OFFICE_HUB_EXAMPLE_INTERVENTION_ID,
    type: "status_change",
    createdAt: hoursAgo(3),
    createdByUid: getDefaultAssignedTechnicianUid(),
    oldStatus: "in_progress",
    newStatus: "done",
    actorRole: "technician",
  },
];

export type BackOfficeHubExampleEmail = {
  id: string;
  direction: "inbound" | "outbound";
  subject: string;
  preview: string;
  at: string;
};

export const BACK_OFFICE_HUB_EXAMPLE_EMAILS: BackOfficeHubExampleEmail[] = [
  {
    id: "ex-mail-1",
    direction: "inbound",
    subject: "Demande urgente — porte bloquée",
    preview: "Bonjour, notre bureau est inaccessible depuis ce matin. Pouvez-vous intervenir cet après-midi ?",
    at: hoursAgo(50),
  },
  {
    id: "ex-mail-2",
    direction: "outbound",
    subject: "Re: Demande urgente — créneau 14h30",
    preview: "Bonjour, un technicien peut être sur place à 14h30. Merci de confirmer la présence sur site.",
    at: hoursAgo(40),
  },
  {
    id: "ex-mail-3",
    direction: "inbound",
    subject: "Re: créneau 14h30",
    preview: "Parfait, je serai sur place. Code porte : 4521B.",
    at: hoursAgo(38),
  },
];

export type BackOfficeHubExampleMaterialOrder = {
  id: string;
  label: string;
  status: "ordered" | "received";
  urgency: "normal" | "urgent";
};

export const BACK_OFFICE_HUB_EXAMPLE_MATERIAL_ORDERS: BackOfficeHubExampleMaterialOrder[] = [
  {
    id: "ex-mat-1",
    label: "Cylindre européen 30/30 — 1 pc",
    status: "received",
    urgency: "normal",
  },
  {
    id: "ex-mat-2",
    label: "Gâche électrique de remplacement",
    status: "ordered",
    urgency: "urgent",
  },
];
