/**
 * @jest-environment node
 */

describe("resolveMobileAccessAllowed", () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE;
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN;
    delete process.env.ALLOW_MOBILE;
    delete process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env = env;
  });

  it("false en développement par défaut", async () => {
    process.env.NODE_ENV = "development";
    const { resolveMobileAccessAllowed } = await import("@/core/config/resolveMobileAccessAllowed");
    expect(resolveMobileAccessAllowed()).toBe(false);
  });

  it("true en production par défaut", async () => {
    process.env.NODE_ENV = "production";
    const { resolveMobileAccessAllowed } = await import("@/core/config/resolveMobileAccessAllowed");
    expect(resolveMobileAccessAllowed()).toBe(true);
  });

  it("opt-out explicite en production", async () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_ALLOW_MOBILE = "false";
    const { resolveMobileAccessAllowed } = await import("@/core/config/resolveMobileAccessAllowed");
    expect(resolveMobileAccessAllowed()).toBe(false);
  });

  it("ALLOW_MOBILE serveur sans rebuild client", async () => {
    process.env.NODE_ENV = "development";
    process.env.ALLOW_MOBILE = "true";
    const { resolveMobileAccessAllowed } = await import("@/core/config/resolveMobileAccessAllowed");
    expect(resolveMobileAccessAllowed()).toBe(true);
  });
});

describe("mobileAccess", () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE;
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN;
    delete process.env.ALLOW_MOBILE;
    process.env.NODE_ENV = "development";
  });

  afterAll(() => {
    process.env = env;
  });

  it("false en dev sans flag", async () => {
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
