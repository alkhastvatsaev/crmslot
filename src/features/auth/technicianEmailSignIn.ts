import { signInWithEmailAndPassword, type Auth, type UserCredential } from "firebase/auth";
import { emailPasswordAuthErrorFeedback } from "@/features/auth/clientPortalEmailPasswordAuth";

export async function signInTechnicianWithEmail(params: {
  auth: Auth;
  email: string;
  password: string;
}): Promise<UserCredential> {
  return signInWithEmailAndPassword(params.auth, params.email.trim(), params.password);
}

export function technicianEmailSignInErrorFeedback(e: unknown): {
  titleKey: string;
  descriptionKey?: string;
} {
  return emailPasswordAuthErrorFeedback(e);
}
