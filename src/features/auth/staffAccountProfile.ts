import { deleteUser, type User } from "firebase/auth";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import {
  isStaffAccountRoleOption,
  type StaffAccountRoleOption,
} from "@/features/auth/staffAccountRoleDisplay";

export type StaffAccountDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  accountRole: StaffAccountRoleOption;
};

export async function saveStaffAccountProfile(
  _user: User,
  draft: StaffAccountDraft,
  options: {
    previousCompanyId: string;
    setActiveCompanyId: (id: string) => void;
    refreshClaimsSilent: (activeCompanyId?: string) => Promise<boolean>;
  }
): Promise<StaffAccountDraft> {
  const res = await fetchWithAuth("/api/account/staff-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      email: draft.email,
      companyId: draft.companyId,
      accountRole: draft.accountRole,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    accountRole?: StaffAccountRoleOption;
    companyId?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error?.trim() || "Enregistrement impossible.");
  }

  const savedCompanyId = data.companyId?.trim() || draft.companyId.trim();
  const savedAccountRole = isStaffAccountRoleOption(data.accountRole)
    ? data.accountRole
    : draft.accountRole;

  if (savedCompanyId) {
    options.setActiveCompanyId(savedCompanyId);
    await options.refreshClaimsSilent(savedCompanyId);
  }

  return {
    ...draft,
    companyId: savedCompanyId,
    accountRole: savedAccountRole,
  };
}

export async function deleteStaffAccount(user: User): Promise<void> {
  await deleteUser(user);
}
