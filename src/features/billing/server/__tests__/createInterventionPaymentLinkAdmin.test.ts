/** @jest-environment node */

import { createInterventionPaymentLinkAdmin } from "@/features/billing/server/createInterventionPaymentLinkAdmin";
import type { Intervention } from "@/features/interventions";

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

describe("createInterventionPaymentLinkAdmin", () => {
  const envStripe = process.env.STRIPE_SECRET_KEY;
  const envMock = process.env.STRIPE_MOCK_MODE;
  const envPublic = process.env.PUBLIC_APP_URL;

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_MOCK_MODE = "1";
    process.env.PUBLIC_APP_URL = "https://app.test";
  });

  afterEach(() => {
    if (envStripe === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = envStripe;
    if (envMock === undefined) delete process.env.STRIPE_MOCK_MODE;
    else process.env.STRIPE_MOCK_MODE = envMock;
    if (envPublic === undefined) delete process.env.PUBLIC_APP_URL;
    else process.env.PUBLIC_APP_URL = envPublic;
  });

  it("crée un lien mock et met à jour Firestore", async () => {
    const update = jest.fn(async () => {});
    const db = {
      collection: () => ({
        doc: () => ({ update }),
      }),
    };

    const result = await createInterventionPaymentLinkAdmin({
      db: db as never,
      interventionId: "iv-pay-1",
      actorUid: "admin-1",
      iv: iv(),
    });

    expect(result.mock).toBe(true);
    expect(result.url).toContain("/api/stripe/mock-pay");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: "pending",
        stripePaymentLinkUrl: expect.stringContaining("mock-pay"),
      })
    );
  });

  it("réutilise un lien existant", async () => {
    const update = jest.fn();
    const db = { collection: () => ({ doc: () => ({ update }) }) };

    const result = await createInterventionPaymentLinkAdmin({
      db: db as never,
      interventionId: "iv-pay-1",
      actorUid: "admin-1",
      iv: iv({ stripePaymentLinkUrl: "https://pay.stripe.com/existing" }),
    });

    expect(result.url).toBe("https://pay.stripe.com/existing");
    expect(update).not.toHaveBeenCalled();
  });
});
