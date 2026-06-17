import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAdditionalUserInfo,
  signOut,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { requestDefaultCompanyMembership } from "@/features/auth/requestDefaultCompanyMembership";
import type { CrmStaffOAuthMode } from "@/features/auth/crmStaffOAuthMode";

export class CrmStaffJoinCompanyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrmStaffJoinCompanyError";
  }
}

export class CrmStaffOAuthModeError extends Error {
  readonly code: "account_not_found" | "account_already_exists";

  constructor(code: "account_not_found" | "account_already_exists") {
    super(code);
    this.name = "CrmStaffOAuthModeError";
    this.code = code;
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

/** Après Google / Apple — respecte l’onglet Connexion vs Créer un compte. */
export async function completeCrmStaffOAuthSession(
  cred: UserCredential,
  mode: CrmStaffOAuthMode,
  auth?: Auth | null
): Promise<CrmStaffOAuthMode> {
  const isNewUser = getAdditionalUserInfo(cred)?.isNewUser ?? false;

  if (mode === "login") {
    if (isNewUser) {
      try {
        await deleteUser(cred.user);
      } catch {
        /* Firebase peut refuser si session incomplète */
      }
      throw new CrmStaffOAuthModeError("account_not_found");
    }
    await syncDefaultCompanyMembershipAfterLogin(cred);
    return "login";
  }

  if (!isNewUser) {
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        /* ignore */
      }
    }
    throw new CrmStaffOAuthModeError("account_already_exists");
  }

  await joinDefaultCompanyAfterSignUp(cred);
  return "register";
}
