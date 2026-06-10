/** @jest-environment node */

const mockConstructEvent = jest.fn();
const mockUpdate = jest.fn(async () => undefined);
const mockGet = jest.fn(async () => ({
  exists: true,
  data: () => ({
    companyId: "co-test",
    title: "Test",
    address: "Rue Test",
    status: "invoiced",
  }),
}));
const mockTimelineAdd = jest.fn(async () => undefined);

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  }));
});

jest.mock("@/core/config/firebase-admin", () => ({
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: mockGet,
        update: mockUpdate,
        collection: () => ({ add: mockTimelineAdd }),
      }),
    }),
  }),
}));

jest.mock("@/core/services/notifications/clientPaymentPush", () => ({
  notifyClientPaymentReceived: jest.fn(async () => undefined),
}));

jest.mock("@/features/crmHistory/logCrmInterventionActionAdmin", () => ({
  logCrmInterventionActionAdmin: jest.fn(async () => undefined),
}));

describe("POST /api/webhooks/stripe", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_x",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    };
    mockConstructEvent.mockReset();
    mockUpdate.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 500 when Stripe webhook is not configured", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { POST } = await import("../stripe/route");
    const res = await POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST" }));
    expect(res.status).toBe(500);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("../stripe/route");
    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it("marks intervention paid on checkout.session.completed", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { interventionId: "iv-paid-1" },
          payment_intent: "pi_123",
        },
      },
    });

    const { POST } = await import("../stripe/route");
    const res = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "sig_test" },
        body: "{}",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: "paid",
        stripePaymentIntentId: "pi_123",
      })
    );
  });
});
