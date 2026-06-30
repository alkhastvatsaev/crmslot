import {
  appendEnvDefaultMembershipFallback,
  mergeCompanyMembershipRows,
  pickActiveCompanyId,
  resolveCompanyMembershipDisplayName,
  type CompanyLiveState,
} from "@/features/company/resolveCompanyMembershipRows";

describe("resolveCompanyMembershipDisplayName", () => {
  const prev = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
    else process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = prev;
  });

  it("remplace ABC par AntwerpenSlot", () => {
    expect(resolveCompanyMembershipDisplayName("legacy-co", "ABC")).toBe("AntwerpenSlot");
  });

  it("utilise le nom live pour les autres sociétés", () => {
    expect(resolveCompanyMembershipDisplayName("other", "Bruxelles SA")).toBe("Bruxelles SA");
  });
});

describe("mergeCompanyMembershipRows", () => {
  it("prefers live company name over stale membership snapshot", () => {
    const rows = mergeCompanyMembershipRows(
      [{ companyId: "co-1", role: "admin", fallbackName: "ABC" }],
      new Map<string, import("@/features/company/resolveCompanyMembershipRows").CompanyLiveState>([
        ["co-1", { name: "AntwerpenSlot" }],
      ])
    );
    expect(rows).toEqual([{ companyId: "co-1", role: "admin", companyName: "AntwerpenSlot" }]);
  });

  it("keeps memberships even when the company document was deleted", () => {
    const rows = mergeCompanyMembershipRows(
      [
        { companyId: "old", role: "admin", fallbackName: "ABC" },
        { companyId: "new", role: "admin", fallbackName: "ABC" },
      ],
      new Map<string, CompanyLiveState>([
        ["old", "missing"],
        ["new", { name: "AntwerpenSlot" }],
      ])
    );
    expect(rows).toEqual([
      { companyId: "old", role: "admin", companyName: "AntwerpenSlot" },
      { companyId: "new", role: "admin", companyName: "AntwerpenSlot" },
    ]);
  });
});

describe("appendEnvDefaultMembershipFallback", () => {
  const prev = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
    else process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = prev;
  });

  it("propose AntwerpenSlot quand aucune membership", () => {
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID = "co-antwerp";
    expect(appendEnvDefaultMembershipFallback([])).toEqual([
      { companyId: "co-antwerp", role: "collaborateur", companyName: "AntwerpenSlot" },
    ]);
  });
});

describe("pickActiveCompanyId", () => {
  const rows = [{ companyId: "new", role: "admin" as const, companyName: "AntwerpenSlot" }];

  it("falls back when stored id points to a removed company", () => {
    const live = new Map<string, CompanyLiveState>([
      ["new", { name: "AntwerpenSlot" }],
      ["old", "missing" as const],
    ]);
    expect(pickActiveCompanyId(rows, "", "old", live)).toBe("new");
  });
});
