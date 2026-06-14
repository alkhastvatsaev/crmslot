/** @jest-environment node */

import { issueInterventionInvoiceAdmin } from "@/features/interventions/server/issueInterventionInvoiceAdmin";
import type { Intervention } from "@/features/interventions/types";

const mockPrepare = jest.fn();
const mockFinalize = jest.fn();
const mockTransition = jest.fn();
const mockSendMail = jest.fn();
const mockAllocateNumber = jest.fn();

jest.mock("@/features/interventions/server/prepareDraftBillingOnIntervention", () => ({
  prepareDraftBillingOnIntervention: (...args: unknown[]) => mockPrepare(...args),
}));

jest.mock("@/features/interventions/server/finalizeInterventionInvoiceAdmin", () => ({
  finalizeInterventionInvoiceAdmin: (...args: unknown[]) => mockFinalize(...args),
}));

jest.mock("@/features/interventions/server/interventionInvoiceEmail", () => ({
  sendInterventionInvoiceEmailToClient: (...args: unknown[]) => mockSendMail(...args),
}));

jest.mock("@/features/interventions/workflow/transitionInterventionStatusAdmin", () => ({
  transitionInterventionStatusAdmin: (...args: unknown[]) => mockTransition(...args),
}));

jest.mock("@/features/billing/server/allocateInvoiceNumberAdmin", () => ({
  allocateInvoiceNumberAdmin: (...args: unknown[]) => mockAllocateNumber(...args),
}));

jest.mock("@/features/billing/server/createInterventionPaymentLinkAdmin", () => ({
  createInterventionPaymentLinkAdmin: jest.fn().mockResolvedValue({
    url: "https://pay.test/link",
    paymentStatus: "pending",
    mock: true,
  }),
}));

jest.mock("@/features/interventions/server/ensurePortalAccessTokenAdmin", () => ({
  ensurePortalAccessTokenAdmin: jest.fn().mockResolvedValue("portal-token-abc"),
}));

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "__ts__" },
}));

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-issue-1",
    title: "Porte",
    address: "Rue 1",
    time: "10:00",
    status: "done",
    location: { lat: 50.8, lng: 4.35 },
    companyId: "co-1",
    clientEmail: "client@example.com",
    billingLines: [{ description: "Déplacement", quantity: 1, unitPriceCents: 4500 }],
    ...partial,
  };
}

function makeDb(initial: Intervention, refreshed?: Intervention) {
  const after = refreshed ?? {
    ...initial,
    billingLines: [{ description: "Déplacement", quantity: 1, unitPriceCents: 4500 }],
    invoiceAmountCents: 4500,
  };
  let getCalls = 0;
  const update = jest.fn(async () => {});
  return {
    db: {
      collection: () => ({
        doc: () => ({
          get: async () => {
            getCalls += 1;
            const data = getCalls === 1 ? initial : after;
            return { exists: true, id: data.id, data: () => data };
          },
          update,
        }),
      }),
    },
    update,
  };
}

describe("issueInterventionInvoiceAdmin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAllocateNumber.mockResolvedValue("FAC-2026-00012");
    mockPrepare.mockResolvedValue({
      billingLines: [{ description: "Déplacement", quantity: 1, unitPriceCents: 4500 }],
      invoiceAmountCents: 4500,
      source: "template",
    });
    mockFinalize.mockResolvedValue({
      invoicePdfUrl: "https://storage.example/invoice.pdf",
      invoicePdfStoragePath: "invoices/iv-issue-1.pdf",
      invoiceAmountCents: 4500,
    });
    mockTransition.mockResolvedValue({ id: "evt-1" });
    mockSendMail.mockResolvedValue({ ok: true });
  });

  it("émet la facture et envoie l'e-mail client", async () => {
    const { db } = makeDb(iv());
    const result = await issueInterventionInvoiceAdmin({
      db: db as never,
      interventionId: "iv-issue-1",
      actorUid: "tech-1",
      sendEmail: true,
      actorRole: "technician",
    });
    expect(result.emailSent).toBe(true);
    expect(result.invoiceNumber).toBe("FAC-2026-00012");
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        toStatus: "invoiced",
        actor: expect.objectContaining({ role: "technician", uid: "tech-1" }),
      })
    );
  });

  it("refuse si le statut n'est pas done", async () => {
    const { db } = makeDb(iv({ status: "in_progress" }));
    await expect(
      issueInterventionInvoiceAdmin({
        db: db as never,
        interventionId: "iv-issue-1",
        actorUid: "tech-1",
      })
    ).rejects.toThrow(/done/);
  });
});
