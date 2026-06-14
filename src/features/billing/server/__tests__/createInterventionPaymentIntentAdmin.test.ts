/** @jest-environment node */

import { createInterventionPaymentIntentAdmin } from "@/features/billing/server/createInterventionPaymentIntentAdmin";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-pay-1",
    title: "Porte",
    address: "Rue 1",
    time: "10:00",
    status: "invoiced",
    location: { lat: 50.8, lng: 4.35 },
    companyId: "co-1",
    invoiceAmountCents: 12_500,
    paymentStatus: "unpaid",
    ...partial,
  };
}

describe("createInterventionPaymentIntentAdmin", () => {
  const envStripe = process.env.STRIPE_SECRET_KEY;
  const envMock = process.env.STRIPE_MOCK_MODE;

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_MOCK_MODE = "1";
  });

  afterEach(() => {
    if (envStripe === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = envStripe;
    if (envMock === undefined) delete process.env.STRIPE_MOCK_MODE;
    else process.env.STRIPE_MOCK_MODE = envMock;
  });

  it("returns null clientSecret in mock mode", async () => {
    const db = { collection: () => ({ doc: () => ({ update: jest.fn() }) }) };

    const result = await createInterventionPaymentIntentAdmin({
      db: db as never,
      interventionId: "iv-pay-1",
      actorUid: "user-1",
      iv: iv(),
    });

    expect(result.mock).toBe(true);
    expect(result.clientSecret).toBeNull();
  });

  it("skips when already paid", async () => {
    const db = { collection: () => ({ doc: () => ({ update: jest.fn() }) }) };

    const result = await createInterventionPaymentIntentAdmin({
      db: db as never,
      interventionId: "iv-pay-1",
      actorUid: "user-1",
      iv: iv({ paymentStatus: "paid" }),
    });

    expect(result.skipped).toBe(true);
    expect(result.clientSecret).toBeNull();
  });
});
