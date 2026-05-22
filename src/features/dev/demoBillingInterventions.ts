import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import type { Intervention } from "@/features/interventions/types";

/** Aperçu facturation quand aucune intervention facturable en Firestore. */
export const DEMO_BILLING_INTERVENTIONS: Intervention[] = [
  {
    id: "demo-bill-1",
    companyId: DEMO_COMPANY_ID,
    clientName: "Dupont — Ixelles",
    address: "Av. Louise 120, 1050 Ixelles",
    status: "done",
    paymentStatus: "unpaid",
    billingLines: [
      { description: "Ouverture porte blindée", quantity: 1, unitPriceCents: 18500 },
      { description: "Remplacement cylindre", quantity: 1, unitPriceCents: 8900 },
    ],
  },
  {
    id: "demo-bill-2",
    companyId: DEMO_COMPANY_ID,
    clientName: "Martin SPRL",
    address: "Rue du Commerce 8, 1000 Bruxelles",
    status: "invoiced",
    paymentStatus: "pending",
    billingLines: [
      { description: "Serrure multipoint", quantity: 1, unitPriceCents: 42000 },
      { description: "Main d'œuvre", quantity: 2, unitPriceCents: 6500 },
    ],
    invoicePdfUrl: "https://example.com/demo-invoice.pdf",
  },
  {
    id: "demo-bill-3",
    companyId: DEMO_COMPANY_ID,
    clientName: "Clinique Saint-Jean",
    address: "Bld de la Woluwe 40, 1200 Woluwe",
    status: "invoiced",
    paymentStatus: "paid",
    paidAt: "2026-05-10T14:00:00.000Z",
    billingLines: [{ description: "Contrôle accès badge", quantity: 1, unitPriceCents: 15000 }],
  },
  {
    id: "demo-bill-4",
    companyId: DEMO_COMPANY_ID,
    clientName: "Garage Central",
    address: "Chaussée de Namur 200, 5000 Namur",
    status: "done",
    paymentStatus: "unpaid",
    billingLines: [],
  },
  {
    id: "demo-bill-5",
    companyId: DEMO_COMPANY_ID,
    clientName: "Résidence Les Orchidées",
    address: "Drève du Pinson 5, 1180 Uccle",
    status: "done",
    paymentStatus: "unpaid",
    billingLines: [
      { description: "Gâche électrique", quantity: 2, unitPriceCents: 12000 },
    ],
  },
];

export function isDemoBillingInterventionId(id: string): boolean {
  return id.startsWith("demo-bill-");
}

export function demoBillingForCompany(companyId: string): Intervention[] {
  const cid = companyId.trim();
  if (!cid) return [];
  return DEMO_BILLING_INTERVENTIONS.map((iv) => ({ ...iv, companyId: cid }));
}
