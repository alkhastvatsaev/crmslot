import type { CompanyStaffMember } from "@/features/teamHub/types";
import type { TeamHubStaffFilter } from "@/features/teamHub/teamHubTypes";

export type TeamHubKpis = {
  totalCount: number;
  activeCount: number;
  technicianCount: number;
};

export function buildTeamHubKpis(staff: CompanyStaffMember[]): TeamHubKpis {
  const activeCount = staff.filter((m) => m.active).length;
  const technicianCount = staff.filter((m) => m.hasTechnicianProfile && m.active).length;
  return {
    totalCount: staff.length,
    activeCount,
    technicianCount,
  };
}

export function filterTeamStaff(
  staff: CompanyStaffMember[],
  filter: TeamHubStaffFilter
): CompanyStaffMember[] {
  switch (filter) {
    case "active":
      return staff.filter((m) => m.active);
    case "inactive":
      return staff.filter((m) => !m.active);
    case "technicians":
      return staff.filter((m) => m.hasTechnicianProfile);
    default:
      return staff;
  }
}

export function countForTeamFilter(
  staff: CompanyStaffMember[],
  filter: TeamHubStaffFilter
): number {
  return filterTeamStaff(staff, filter).length;
}
