/**
 * API publique teamHub — hub Équipe (slot 5), annuaire staff société.
 * UI slot pager → `TeamHubPage`.
 */
export { default as TeamHubPage } from "@/features/teamHub/components/TeamHubPage";
export { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
export { useCompanyStaff } from "@/features/teamHub/hooks/useCompanyStaff";
export { useCompanyStaffActions } from "@/features/teamHub/hooks/useCompanyStaffActions";
export { useCreateCompanyStaff } from "@/features/teamHub/hooks/useCreateCompanyStaff";
export { buildTeamHubKpis } from "@/features/teamHub/teamHubPatronMetrics";
export type { TeamHubKpis } from "@/features/teamHub/teamHubPatronMetrics";
export {
  resolveCompanyStaffKind,
  parseStaffContactInput,
  companyStaffKindToMembershipRole,
} from "@/features/teamHub/resolveCompanyStaffKind";
export type {
  CompanyStaffMember,
  CompanyStaffRole,
  CompanyStaffKind,
  CompanyStaffUpdateInput,
  CreateCompanyStaffInput,
  CreateCompanyStaffResult,
} from "@/features/teamHub/types";
