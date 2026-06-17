import {
  createUserWithEmailAndPassword,
  deleteUser,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { requestDefaultCompanyMembership } from "@/features/auth/requestDefaultCompanyMembership";

export class CrmStaffJoinCompanyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrmStaffJoinCompanyError";
  }
}

/** Connexion : rattachement idempotent à la société unique. */
export async function syncDefaultCompanyMembershipAfterLogin(cred: UserCredential): Promise<void> {
  const result = await requestDefaultCompanyMembership(cred.user);
  if (!result.ok) {
    throw new CrmStaffJoinCompanyError(result.error);
  }
}

export async function joinDefaultCompanyAfterSignUp(cred: UserCredential): Promise<string> {
  const result = await requestDefaultCompanyMembership(cred.user);

  if (!result.ok) {
    try {
      await deleteUser(cred.user);
    } catch {
      /* compte orphelin — admin pourra lier manuellement */
    }
    throw new CrmStaffJoinCompanyError(result.error);
  }

  return result.companyId;
}

export async function registerCrmStaffAccount(params: {
  auth: Auth;
  email: string;
  password: string;
}): Promise<{ companyId: string }> {
  const cred = await createUserWithEmailAndPassword(
    params.auth,
    params.email.trim(),
    params.password
  );
  const companyId = await joinDefaultCompanyAfterSignUp(cred);
  return { companyId };
}
