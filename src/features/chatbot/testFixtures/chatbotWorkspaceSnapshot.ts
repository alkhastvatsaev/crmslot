import type { WorkspaceCopilotSnapshot } from "@/features/copilot";

/** Snapshot minimal pour tests chatbot (Vatsaev, 3 adresses, pas de fiche CRM). */
export function buildChatbotTestSnapshot(
  overrides?: Partial<WorkspaceCopilotSnapshot>
): WorkspaceCopilotSnapshot {
  return {
    generatedAt: "2026-05-18T10:00:00Z",
    locale: "fr",
    company: { id: "co-test", name: "Test SA", role: "admin" },
    summary: {
      totalInterventions: 3,
      byStatus: { done: 3 },
      urgentOpen: 0,
      awaitingAssignment: 0,
      inProgress: 0,
      doneOrInvoiced: 3,
      unpaidCount: 3,
      paidCount: 0,
      pendingOfflineQueue: 0,
      navigatorOnline: true,
    },
    clients: [],
    interventions: [
      {
        id: "iv-lombard",
        title: "Serrure",
        status: "done",
        clientName: "Monsieur Vatsaev",
        address: "9 rue du Lombard",
        problem: null,
        scheduled: null,
        paymentStatus: "unpaid",
        invoiceAmountEur: 100,
        urgency: false,
        hasAudio: false,
        hasInvoicePdf: true,
        clientEmail: null,
      },
      {
        id: "iv-fourche",
        title: "Porte",
        status: "done",
        clientName: "Monsieur Vatsaev",
        address: "Rue de la Fourche 9, 1000 Bruxelles",
        problem: null,
        scheduled: null,
        paymentStatus: "unpaid",
        invoiceAmountEur: 350,
        urgency: false,
        hasAudio: false,
        hasInvoicePdf: true,
        clientEmail: null,
      },
      {
        id: "iv-strasbourg",
        title: "Autre",
        status: "done",
        clientName: "Monsieur Vatsaev",
        address: "17 Rue Sénèque, 07200 Strasbourg",
        problem: null,
        scheduled: null,
        paymentStatus: "unpaid",
        invoiceAmountEur: 200,
        urgency: false,
        hasAudio: false,
        hasInvoicePdf: false,
        clientEmail: null,
      },
    ],
    ...overrides,
  };
}

/** Documents Firestore `clients` pour les tests executor. */
export const CHATBOT_TEST_CRM_CLIENT = {
  id: "cl-vatsaev",
  companyId: "co-test",
  displayName: "Monsieur Vatsaev",
  firstName: "Alkhast",
  lastName: "Vatsaev",
  phone: "+32470000000",
  email: null,
};

/** Interventions brutes (champs Firestore) alignées sur le snapshot. */
export function chatbotTestInterventionRows() {
  return [
    {
      id: "iv-lombard",
      companyId: "co-test",
      status: "done",
      clientName: "Monsieur Vatsaev",
      address: "9 rue du Lombard",
      urgency: false,
    },
    {
      id: "iv-fourche",
      companyId: "co-test",
      status: "done",
      clientName: "Monsieur Vatsaev",
      address: "Rue de la Fourche 9, 1000 Bruxelles",
      urgency: false,
      billingLines: [{ label: "Main d'oeuvre", unitPriceCents: 35000, quantity: 1 }],
    },
    {
      id: "iv-strasbourg",
      companyId: "co-test",
      status: "pending",
      clientName: "Monsieur Vatsaev",
      address: "17 Rue Sénèque, 07200 Strasbourg",
      urgency: true,
    },
  ];
}
