/**
 * API serveur company — staff Firestore Admin (routes API uniquement).
 */
export { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
export {
  ensureAssignableTechnicianProfiles,
  listAssignableTechnicians,
} from "@/features/company/server/listAssignableTechnicians";
export { assertCompanyStaffAccess } from "@/features/company/server/assertCompanyStaffAccess";
export { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";
export type { JoinDefaultCompanyOptions } from "@/features/company/server/joinDefaultCompanyMembership";
export { joinDefaultCompanyMembership } from "@/features/company/server/joinDefaultCompanyMembership";
export { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
export { requireCompanyMember } from "@/features/company/server/requireCompanyMember";
export { setCompanyStaffActive } from "@/features/company/server/setCompanyStaffActive";
export { removeCompanyStaffMember } from "@/features/company/server/removeCompanyStaffMember";
export { updateCompanyStaffMember } from "@/features/company/server/updateCompanyStaffMember";
export { changeCompanyStaffKind } from "@/features/company/server/changeCompanyStaffKind";
export { createCompanyStaffMember } from "@/features/company/server/createCompanyStaffMember";
