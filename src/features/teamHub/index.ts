/**
 * API publique teamHub — hub Équipe (slot 5), annuaire staff société.
 * UI slot pager → `TeamHubPage`.
 */
export { default as TeamHubPage } from "@/features/teamHub/components/TeamHubPage";
export { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
export { useCompanyStaff } from "@/features/teamHub/hooks/useCompanyStaff";
export { useCompanyStaffActions } from "@/features/teamHub/hooks/useCompanyStaffActions";
export {
  buildTeamHubKpis,
  filterTeamStaff,
  countForTeamFilter,
} from "@/features/teamHub/teamHubPatronMetrics";
export type { TeamHubKpis } from "@/features/teamHub/teamHubPatronMetrics";
export type { TeamHubStaffFilter } from "@/features/teamHub/teamHubTypes";
export type {
  CompanyStaffMember,
  CompanyStaffRole,
  CompanyStaffUpdateInput,
} from "@/features/teamHub/types";
