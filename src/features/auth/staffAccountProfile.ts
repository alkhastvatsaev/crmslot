import { deleteUser, type User } from "firebase/auth";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { CompanyRole } from "@/features/company";

export type StaffAccountDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  role: CompanyRole;
};

export async function saveStaffAccountProfile(
  _user: User,
  draft: StaffAccountDraft,
  options: {
    previousCompanyId: string;
    setActiveCompanyId: (id: string) => void;
    refreshClaimsSilent: () => Promise<boolean>;
  }
): Promise<void> {
  const res = await fetchWithAuth("/api/account/staff-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      email: draft.email,
      companyId: draft.companyId,
      role: draft.role,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data.error?.trim() || "Enregistrement impossible.");
  }

  if (draft.companyId && draft.companyId !== options.previousCompanyId) {
    options.setActiveCompanyId(draft.companyId);
  }
  await options.refreshClaimsSilent();
}

export async function deleteStaffAccount(user: User): Promise<void> {
  await deleteUser(user);
}
