import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from "firebase/auth";

export class ClientPortalEmailNotVerifiedError extends Error {
  constructor() {
    super("auth/email-not-verified");
    this.name = "ClientPortalEmailNotVerifiedError";
  }
}

export async function registerClientPortalAccount(params: {
  auth: Auth;
  email: string;
  password: string;
}): Promise<{ email: string }> {
  const cred = await createUserWithEmailAndPassword(
    params.auth,
    params.email.trim(),
    params.password
  );
  await sendEmailVerification(cred.user);
  await signOut(params.auth);
  return { email: params.email.trim() };
}

export async function signInClientPortalWithVerifiedEmail(params: {
  auth: Auth;
  email: string;
  password: string;
}): Promise<UserCredential> {
  const cred = await signInWithEmailAndPassword(params.auth, params.email.trim(), params.password);

  if (cred.user.emailVerified) {
    return cred;
  }

  try {
    await sendEmailVerification(cred.user);
  } catch {
    /* renvoi optionnel — connexion déjà refusée */
  }
  await signOut(params.auth);
  throw new ClientPortalEmailNotVerifiedError();
}
