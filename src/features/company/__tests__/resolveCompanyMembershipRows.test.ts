import {
  mergeCompanyMembershipRows,
  pickActiveCompanyId,
} from "@/features/company/resolveCompanyMembershipRows";

describe("mergeCompanyMembershipRows", () => {
  it("prefers live company name over stale membership snapshot", () => {
    const rows = mergeCompanyMembershipRows(
      [{ companyId: "co-1", role: "admin", fallbackName: "ABC" }],
      new Map([["co-1", { name: "AntwerpenSlot" }]])
    );
    expect(rows).toEqual([{ companyId: "co-1", role: "admin", companyName: "AntwerpenSlot" }]);
  });

  it("drops memberships whose company document was deleted", () => {
    const rows = mergeCompanyMembershipRows(
      [
        { companyId: "old", role: "admin", fallbackName: "ABC" },
        { companyId: "new", role: "admin", fallbackName: "ABC" },
      ],
      new Map([
        ["old", "missing"],
        ["new", { name: "AntwerpenSlot" }],
      ])
    );
    expect(rows).toEqual([{ companyId: "new", role: "admin", companyName: "AntwerpenSlot" }]);
  });
});

describe("pickActiveCompanyId", () => {
  const rows = [{ companyId: "new", role: "admin" as const, companyName: "AntwerpenSlot" }];

  it("falls back when stored id points to a removed company", () => {
    expect(pickActiveCompanyId(rows, "", "old")).toBe("new");
  });
});
