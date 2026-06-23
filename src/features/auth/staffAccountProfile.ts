import { deleteUser, updateEmail, updateProfile, type User } from "firebase/auth";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import type { CompanyRole } from "@/features/company";

export type StaffAccountDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyId: string;
  role: CompanyRole;
};

function buildDisplayName(
  draft: Pick<StaffAccountDraft, "firstName" | "lastName" | "email">
): string {
  const full = [draft.firstName, draft.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  return draft.email.trim() || "Technicien";
}

function technicianInitial(name: string): string {
  return (name.trim().charAt(0) || "T").toUpperCase();
}

export async function saveStaffAccountProfile(
  user: User,
  draft: StaffAccountDraft,
  options: {
    previousCompanyId: string;
    setActiveCompanyId: (id: string) => void;
    refreshClaimsSilent: () => Promise<boolean>;
  }
): Promise<void> {
  if (!firestore) throw new Error("Firestore unavailable");

  const uid = user.uid;
  const firstName = draft.firstName.trim();
  const lastName = draft.lastName.trim();
  const email = draft.email.trim();
  const phone = draft.phone.trim();
  const name = buildDisplayName(draft);

  await setDoc(
    doc(firestore, "technicians", uid),
    {
      authUid: uid,
      companyId: draft.companyId,
      firstName,
      lastName,
      name,
      initial: technicianInitial(name),
      email: email || null,
      phone: phone || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  if (name && user.displayName !== name) {
    await updateProfile(user, { displayName: name });
  }

  const previousEmail = user.email?.trim() ?? "";
  if (email && email !== previousEmail) {
    await updateEmail(user, email);
  }

  await updateDoc(doc(firestore, "users", uid, "company_memberships", draft.companyId), {
    role: draft.role,
    updatedAt: serverTimestamp(),
  });

  if (draft.companyId && draft.companyId !== options.previousCompanyId) {
    options.setActiveCompanyId(draft.companyId);
    await options.refreshClaimsSilent();
  }
}

export async function deleteStaffAccount(user: User): Promise<void> {
  await deleteUser(user);
}
