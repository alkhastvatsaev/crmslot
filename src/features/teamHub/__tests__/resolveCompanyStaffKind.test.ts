import type { CompanyStaffMember } from "@/features/teamHub/types";
import {
  companyStaffKindNeedsTechnicianProfile,
  companyStaffKindToMembershipRole,
  parseStaffContactInput,
  resolveCompanyStaffKind,
} from "@/features/teamHub/resolveCompanyStaffKind";
import { buildTeamHubKpis } from "@/features/teamHub/teamHubPatronMetrics";

function member(overrides: Partial<CompanyStaffMember> = {}): CompanyStaffMember {
  return {
    uid: "u1",
    role: "collaborateur",
    email: "a@test.com",
    firstName: "Ada",
    lastName: "Lovelace",
    displayName: "Ada Lovelace",
    hasTechnicianProfile: false,
    active: true,
    authUid: "u1",
    ...overrides,
  };
}

describe("resolveCompanyStaffKind", () => {
  it("maps admin to dirigeant", () => {
    expect(resolveCompanyStaffKind(member({ role: "admin" }))).toBe("dirigeant");
  });

  it("maps collaborateur with technician profile to technician", () => {
    expect(
      resolveCompanyStaffKind(member({ role: "collaborateur", hasTechnicianProfile: true }))
    ).toBe("technician");
  });

  it("maps collaborateur without technician profile to dispatcher", () => {
    expect(resolveCompanyStaffKind(member())).toBe("dispatcher");
  });
});

describe("parseStaffContactInput", () => {
  it("detects email", () => {
    expect(parseStaffContactInput("Mansour@Example.com")).toEqual({
      email: "mansour@example.com",
      phone: null,
    });
  });

  it("detects phone", () => {
    expect(parseStaffContactInput("+32 470 12 34 56")).toEqual({
      email: null,
      phone: "+32 470 12 34 56",
    });
  });
});

describe("companyStaffKind helpers", () => {
  it("maps staff kinds to membership roles", () => {
    expect(companyStaffKindToMembershipRole("dirigeant")).toBe("admin");
    expect(companyStaffKindToMembershipRole("dispatcher")).toBe("collaborateur");
    expect(companyStaffKindToMembershipRole("technician")).toBe("collaborateur");
  });

  it("flags technician profile requirement", () => {
    expect(companyStaffKindNeedsTechnicianProfile("technician")).toBe(true);
    expect(companyStaffKindNeedsTechnicianProfile("dispatcher")).toBe(false);
  });
});

describe("buildTeamHubKpis", () => {
  it("counts active technicians", () => {
    const kpis = buildTeamHubKpis([
      member({ active: true, hasTechnicianProfile: true }),
      member({ uid: "u2", active: false, hasTechnicianProfile: true }),
      member({ uid: "u3", active: true, hasTechnicianProfile: false }),
    ]);
    expect(kpis).toEqual({ totalCount: 3, activeCount: 2, technicianCount: 1 });
  });
});
