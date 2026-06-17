import {
  createUserWithEmailAndPassword,
  deleteUser,
  type Auth,
  type UserCredential,
} from "firebase/auth";

export class CrmStaffJoinCompanyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CrmStaffJoinCompanyError";
  }
}

export async function joinDefaultCompanyAfterSignUp(cred: UserCredential): Promise<string> {
  const idToken = await cred.user.getIdToken();
  const res = await fetch("/api/company/join-default", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    companyId?: string;
    error?: string;
  };

  if (!res.ok || !data.ok || !data.companyId) {
    try {
      await deleteUser(cred.user);
    } catch {
      /* compte orphelin — admin pourra lier manuellement */
    }
    throw new CrmStaffJoinCompanyError(
      typeof data.error === "string" && data.error.trim()
        ? data.error.trim()
        : "Impossible de rattacher le compte à la société."
    );
  }

  await cred.user.getIdToken(true);
  return data.companyId;
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
