/**
 * API publique auth — rôles, session portail client et guards staff.
 */
export { useAccountRole } from "@/features/auth/useAccountRole";
export type { AccountRole, AccountRoleState } from "@/features/auth/useAccountRole";
export { requestDefaultCompanyMembership } from "@/features/auth/requestDefaultCompanyMembership";
export type { DefaultCompanyMembershipResult } from "@/features/auth/requestDefaultCompanyMembership";
export {
  CLIENT_PORTAL_PROFILE_COLLECTION,
  CLIENT_PORTAL_AUTH_SLOT_INDEX,
} from "@/features/auth/clientPortalConstants";
export type { ClientPortalAccountFields } from "@/features/auth/clientPortalAccountProfile";
export {
  emptyClientPortalAccountFields,
  parseClientPortalAccountDoc,
  resolveClientPortalAccountFields,
  validateClientPortalAccountFields,
  resolveAccountFieldsForSubmit,
  accountFieldsFromRequesterProfile,
  mergeRequesterProfileFromAccount,
  loadClientPortalAccountFields,
  saveClientPortalAccountFields,
} from "@/features/auth/clientPortalAccountProfile";
export {
  useClientPortalAccount,
  isVerifiedClientPortalUser,
} from "@/features/auth/hooks/useClientPortalAccount";
export { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
export type { CrmStaffAccountFields } from "@/features/auth/hooks/useCrmStaffAccountPanel";
export { useClientPortalLinkedCompanyId } from "@/features/auth/hooks/useClientPortalLinkedCompanyId";
export {
  isCrmTenantAuthUser,
  recoverMainAuthFromClientPortalLeak,
} from "@/features/auth/recoverMainAuthFromClientPortalLeak";
