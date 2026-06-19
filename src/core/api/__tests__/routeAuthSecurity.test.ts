/**
 * @jest-environment node
 */
import {
  isProductionNodeEnv,
  requireAnyCompanyStaff,
  requireInboundWebhookSecret,
} from "@/core/api/routeAuth";

describe("requireInboundWebhookSecret", () => {
  const prevEnv = process.env;

  beforeEach(() => {
    process.env = { ...prevEnv };
  });

  afterAll(() => {
    process.env = prevEnv;
  });

  it("rejects when secret missing in production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.EMAIL_INBOUND_SECRET;
    const res = requireInboundWebhookSecret(
      new Request("https://app.test/api/webhooks/email/inbound")
    );
    expect(res?.status).toBe(503);
  });

  it("accepts matching secret", () => {
    process.env.NODE_ENV = "production";
    process.env.EMAIL_INBOUND_SECRET = "s3cr3t";
    const res = requireInboundWebhookSecret(
      new Request("https://app.test/api/webhooks/email/inbound?secret=s3cr3t")
    );
    expect(res).toBeNull();
  });
});

describe("requireAnyCompanyStaff", () => {
  it("allows bmTenants claims", async () => {
    const res = await requireAnyCompanyStaff("uid-1", {
      bmTenants: ["co-1:admin"],
    } as import("firebase-admin").auth.DecodedIdToken);
    expect(res).toBeNull();
  });
});

describe("isProductionNodeEnv", () => {
  it("detects production node env", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(isProductionNodeEnv()).toBe(true);
    process.env.NODE_ENV = prev;
  });
});
