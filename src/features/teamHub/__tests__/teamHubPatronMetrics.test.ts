import { buildTeamHubKpis, filterTeamStaff } from "@/features/teamHub/teamHubPatronMetrics";
import type { CompanyStaffMember } from "@/features/teamHub/types";

const staff: CompanyStaffMember[] = [
  {
    uid: "a",
    role: "admin",
    email: null,
    firstName: "A",
    lastName: "Admin",
    displayName: "A Admin",
    hasTechnicianProfile: false,
    active: true,
    authUid: "a",
  },
  {
    uid: "b",
    role: "collaborateur",
    email: null,
    firstName: "B",
    lastName: "Tech",
    displayName: "B Tech",
    hasTechnicianProfile: true,
    active: true,
    authUid: "b",
  },
  {
    uid: "c",
    role: "collaborateur",
    email: null,
    firstName: "C",
    lastName: "Off",
    displayName: "C Off",
    hasTechnicianProfile: true,
    active: false,
    authUid: "c",
  },
];

describe("teamHubPatronMetrics", () => {
  it("counts staff KPIs", () => {
    const kpis = buildTeamHubKpis(staff);
    expect(kpis.totalCount).toBe(3);
    expect(kpis.activeCount).toBe(2);
    expect(kpis.technicianCount).toBe(1);
  });

  it("filters technicians only", () => {
    expect(filterTeamStaff(staff, "technicians")).toHaveLength(2);
    expect(filterTeamStaff(staff, "inactive")).toHaveLength(1);
  });
});
