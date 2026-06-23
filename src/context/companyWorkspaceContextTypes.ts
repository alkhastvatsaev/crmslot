import type { CompanyMembershipRow, CompanyRole } from "@/features/company/types";

export const ACTIVE_COMPANY_STORAGE_KEY = "crmslot_active_company_id";

export type CompanyWorkspaceApi = {
  firebaseUid: string | null;
  memberships: CompanyMembershipRow[];
  activeCompanyId: string;
  setActiveCompanyId: (id: string) => void;
  activeRole: CompanyRole | null;
  /** Auth + memberships Firestore résolus (évite le fallback chat-only pendant le boot). */
  workspaceReady: boolean;
  /** Au moins une société — interventions filtrées + création avec tenant */
  isTenantUser: boolean;
  /** Rattachement auto à la société unique en cours ou en échec. */
  membershipJoinPending: boolean;
  membershipJoinError: string | null;
  retryDefaultCompanyJoin: () => Promise<void>;
  /** Met à jour bmTenants / bmActive côté token (sans toast). */
  refreshClaimsSilent: () => Promise<boolean>;
};
