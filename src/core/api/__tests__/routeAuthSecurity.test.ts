/**
 * @jest-environment node
 */
import {
  isAnonymousFirebaseUser,
  isProductionNodeEnv,
  rejectAnonymousInProduction,
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
    process.env = { ...process.env, NODE_ENV: "production" };
    delete process.env.EMAIL_INBOUND_SECRET;
    const res = requireInboundWebhookSecret(
      new Request("https://app.test/api/webhooks/email/inbound")
    );
    expect(res?.status).toBe(503);
  });

  it("accepts matching secret", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
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
    } as unknown as import("firebase-admin").auth.DecodedIdToken);
    expect(res).toBeNull();
  });
});

describe("isProductionNodeEnv", () => {
  it("detects production node env", () => {
    const prev = process.env;
    process.env = { ...prev, NODE_ENV: "production" };
    expect(isProductionNodeEnv()).toBe(true);
    process.env = prev;
  });
});

describe("rejectAnonymousInProduction", () => {
  it("blocks anonymous in production", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    const res = rejectAnonymousInProduction({
      firebase: { sign_in_provider: "anonymous" },
    } as unknown as import("firebase-admin").auth.DecodedIdToken);
    expect(res?.status).toBe(403);
  });

  it("allows email provider in production", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    expect(
      rejectAnonymousInProduction({
        firebase: { sign_in_provider: "password" },
      } as unknown as import("firebase-admin").auth.DecodedIdToken)
    ).toBeNull();
  });

  it("detects anonymous provider", () => {
    expect(
      isAnonymousFirebaseUser({
        firebase: { sign_in_provider: "anonymous" },
      } as unknown as import("firebase-admin").auth.DecodedIdToken)
    ).toBe(true);
  });
});
