import {
  readClientPortalDefaultCompanyIdFromEnv,
  resolveBackofficeInboxCompanyIds,
  resolveClientPortalInterventionCompanyId,
} from "@/features/company/clientPortalCompanyId";

describe("readClientPortalDefaultCompanyIdFromEnv", () => {
  const prev = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
    else process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = prev;
  });

  it("trims env value", () => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = "  co-portal  ";
    expect(readClientPortalDefaultCompanyIdFromEnv()).toBe("co-portal");
  });
});

describe("resolveClientPortalInterventionCompanyId", () => {
  const prevEnv = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
  const prevStaging = process.env.NEXT_PUBLIC_STAGING_PREVIEW;

  afterEach(() => {
    if (prevEnv === undefined) delete process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
    else process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = prevEnv;
    if (prevStaging === undefined) delete process.env.NEXT_PUBLIC_STAGING_PREVIEW;
    else process.env.NEXT_PUBLIC_STAGING_PREVIEW = prevStaging;
  });

  it("prefers tenant active company", () => {
    expect(
      resolveClientPortalInterventionCompanyId({
        tenantActiveCompanyId: "co-tenant",
        linkedPortalCompanyId: "co-linked",
      })
    ).toBe("co-tenant");
  });

  it("uses linked portal company before env default", () => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = "co-env";
    expect(resolveClientPortalInterventionCompanyId({ linkedPortalCompanyId: "co-linked" })).toBe(
      "co-linked"
    );
  });

  it("uses env default when no tenant or linked company", () => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = "co-env";
    expect(resolveClientPortalInterventionCompanyId({})).toBe("co-env");
  });

  it("never falls back to demo-local-company when staging preview is on", () => {
    process.env.NEXT_PUBLIC_STAGING_PREVIEW = "true";
    expect(resolveClientPortalInterventionCompanyId({})).toBeNull();
  });
});

describe("resolveBackofficeInboxCompanyIds", () => {
  const prevEnv = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
  const prevStaging = process.env.NEXT_PUBLIC_STAGING_PREVIEW;

  afterEach(() => {
    if (prevEnv === undefined) delete process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
    else process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = prevEnv;
    if (prevStaging === undefined) delete process.env.NEXT_PUBLIC_STAGING_PREVIEW;
    else process.env.NEXT_PUBLIC_STAGING_PREVIEW = prevStaging;
  });

  it("returns empty when not a tenant user", () => {
    expect(resolveBackofficeInboxCompanyIds({ isTenantUser: false } as never)).toEqual([]);
  });

  it("includes active and portal default when admin belongs to both", () => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = "co-portal";
    expect(
      resolveBackofficeInboxCompanyIds({
        isTenantUser: true,
        activeCompanyId: "co-active",
        memberships: [
          { companyId: "co-active", role: "admin" },
          { companyId: "co-portal", role: "admin" },
        ],
      } as never)
    ).toEqual(expect.arrayContaining(["co-active", "co-portal"]));
  });

  it("returns only tenant company ids without demo fallback", () => {
    process.env.NEXT_PUBLIC_STAGING_PREVIEW = "true";
    expect(
      resolveBackofficeInboxCompanyIds({
        isTenantUser: true,
        activeCompanyId: "co-live",
        memberships: [{ companyId: "co-live", role: "admin" }],
      } as never)
    ).toEqual(["co-live"]);
  });
});

describe("resolvePortalChatCompanyId", () => {
  const original = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;

  afterEach(() => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = original;
  });

  it("prefers linked portal company over env default", async () => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = "env-co";
    const { resolvePortalChatCompanyId } = await import("@/features/company/clientPortalCompanyId");
    expect(resolvePortalChatCompanyId("linked-co")).toBe("linked-co");
  });

  it("falls back to env default", async () => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = "env-co";
    const { resolvePortalChatCompanyId } = await import("@/features/company/clientPortalCompanyId");
    expect(resolvePortalChatCompanyId(null)).toBe("env-co");
  });
});
