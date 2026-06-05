/** @jest-environment node */

import { validateInterventionReportServer } from "@/features/interventions/server/validateInterventionReportServer";
import type { Intervention } from "@/features/interventions/types";

const mockAssertDispatch = jest.fn();
const mockPrepare = jest.fn();
const mockFinalize = jest.fn();
const mockTransition = jest.fn();
const mockSendMail = jest.fn();

jest.mock("@/features/backoffice/assignInterventionServerAuth", () => ({
  assertCanAssignInterventionServer: (...args: unknown[]) => mockAssertDispatch(...args),
}));

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

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "__ts__" },
}));

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-val-1",
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
  let call = 0;
  return {
    collection: () => ({
      doc: () => ({
        get: async () => {
          call += 1;
          const data = call === 1 ? initial : after;
          return { exists: true, id: data.id, data: () => data };
        },
      }),
    }),
  };
}

describe("validateInterventionReportServer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssertDispatch.mockResolvedValue(true);
    mockPrepare.mockResolvedValue({
      billingLines: [{ description: "Déplacement", quantity: 1, unitPriceCents: 4500 }],
      invoiceAmountCents: 4500,
      source: "template",
    });
    mockFinalize.mockResolvedValue({
      invoicePdfUrl: "https://storage.example/invoice.pdf",
      invoicePdfStoragePath: "invoices/iv-val-1.pdf",
      invoiceAmountCents: 4500,
    });
    mockTransition.mockResolvedValue({ id: "evt-1" });
    mockSendMail.mockResolvedValue({ ok: true });
  });

  it("validates done report, transitions to invoiced and emails client", async () => {
    const db = makeDb(iv());
    const result = await validateInterventionReportServer({
      db: db as never,
      interventionId: "iv-val-1",
      actorUid: "dispatch-1",
      decoded: { uid: "dispatch-1" } as never,
      sendEmail: true,
    });

    expect(mockPrepare).toHaveBeenCalledWith(db, "iv-val-1");
    expect(mockFinalize).toHaveBeenCalled();
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-val-1",
        toStatus: "invoiced",
        extraPatch: expect.objectContaining({
          invoicePdfUrl: "https://storage.example/invoice.pdf",
          invoiceAmountCents: 4500,
        }),
      }),
    );
    expect(mockSendMail).toHaveBeenCalled();
    expect(result).toEqual({
      invoicePdfUrl: "https://storage.example/invoice.pdf",
      invoiceAmountCents: 4500,
      emailSent: true,
      emailError: undefined,
    });
  });

  it("rejects when status is not done", async () => {
    const db = makeDb(iv({ status: "in_progress" }));
    await expect(
      validateInterventionReportServer({
        db: db as never,
        interventionId: "iv-val-1",
        actorUid: "dispatch-1",
        decoded: {} as never,
      }),
    ).rejects.toThrow('statut « in_progress »');
  });

  it("rejects when dispatcher lacks rights", async () => {
    mockAssertDispatch.mockResolvedValue(false);
    const db = makeDb(iv());
    await expect(
      validateInterventionReportServer({
        db: db as never,
        interventionId: "iv-val-1",
        actorUid: "anon",
        decoded: {} as never,
      }),
    ).rejects.toThrow("Droits insuffisants");
  });

  it("rejects when intervention is missing", async () => {
    const db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false }),
        }),
      }),
    };
    await expect(
      validateInterventionReportServer({
        db: db as never,
        interventionId: "missing",
        actorUid: "dispatch-1",
        decoded: {} as never,
      }),
    ).rejects.toThrow("Intervention introuvable");
  });

  it("rejects when companyId is missing", async () => {
    const db = makeDb(iv({ companyId: undefined }));
    await expect(
      validateInterventionReportServer({
        db: db as never,
        interventionId: "iv-val-1",
        actorUid: "dispatch-1",
        decoded: {} as never,
      }),
    ).rejects.toThrow("companyId manquant");
  });

  it("skips email when sendEmail is false", async () => {
    const db = makeDb(iv());
    const result = await validateInterventionReportServer({
      db: db as never,
      interventionId: "iv-val-1",
      actorUid: "dispatch-1",
      decoded: {} as never,
      sendEmail: false,
    });
    expect(mockSendMail).not.toHaveBeenCalled();
    expect(result.emailSent).toBe(false);
  });

  it("returns emailError when send fails", async () => {
    mockSendMail.mockResolvedValue({ ok: false, error: "SMTP down" });
    const db = makeDb(iv());
    const result = await validateInterventionReportServer({
      db: db as never,
      interventionId: "iv-val-1",
      actorUid: "dispatch-1",
      decoded: {} as never,
    });
    expect(result.emailSent).toBe(false);
    expect(result.emailError).toBe("SMTP down");
  });
});
