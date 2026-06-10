/**
 * @jest-environment node
 */

describe("mobileAccess", () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE;
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN;
  });

  afterAll(() => {
    process.env = env;
  });

  it("false par défaut", async () => {
    const { mobileAccessAllowed } = await import("@/core/config/mobileAccess");
    expect(mobileAccessAllowed).toBe(false);
  });

  it("true si NEXT_PUBLIC_ALLOW_MOBILE=true", async () => {
    process.env.NEXT_PUBLIC_ALLOW_MOBILE = "true";
    const { mobileAccessAllowed } = await import("@/core/config/mobileAccess");
    expect(mobileAccessAllowed).toBe(true);
  });

  it("true si NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN=true", async () => {
    process.env.NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN = "true";
    const { mobileAccessAllowed } = await import("@/core/config/mobileAccess");
    expect(mobileAccessAllowed).toBe(true);
  });
});
