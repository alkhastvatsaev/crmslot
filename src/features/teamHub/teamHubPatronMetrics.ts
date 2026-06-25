import type { CompanyStaffMember } from "@/features/teamHub/types";

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
