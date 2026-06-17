import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type AuthProvider,
  type UserCredential,
} from "firebase/auth";

/** Connexion OAuth lancée en redirect — la page sera rechargée par Firebase. */
export class CrmStaffOAuthRedirectPending extends Error {
  override readonly name = "CrmStaffOAuthRedirectPending";
}

function authErrorCode(e: unknown): string {
  if (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
  ) {
    return (e as { code: string }).code;
  }
  return "";
}

async function signInCrmStaffWithProvider(
  auth: Auth,
  provider: AuthProvider
): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, provider);
  } catch (e) {
    const code = authErrorCode(e);
    if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, provider);
      throw new CrmStaffOAuthRedirectPending();
    }
    throw e;
  }
}

export function createCrmStaffGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function createCrmStaffAppleProvider(): OAuthProvider {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return provider;
}

export async function signInCrmStaffWithGoogle(auth: Auth): Promise<UserCredential> {
  return signInCrmStaffWithProvider(auth, createCrmStaffGoogleProvider());
}

export async function signInCrmStaffWithApple(auth: Auth): Promise<UserCredential> {
  return signInCrmStaffWithProvider(auth, createCrmStaffAppleProvider());
}

export type CrmStaffOAuthProviderId = "google" | "apple";

export function crmStaffOAuthSignInErrorFeedback(
  provider: CrmStaffOAuthProviderId,
  e: unknown
): { titleKey: string; descriptionKey?: string } {
  if (e instanceof CrmStaffOAuthRedirectPending) {
    return { titleKey: "auth.oauth_redirect" };
  }
  const code = authErrorCode(e);
  const prefix = provider === "google" ? "google" : "apple";
  switch (code) {
    case "auth/popup-closed-by-user":
      return { titleKey: `auth.${prefix}_signin_cancelled` };
    case "auth/operation-not-allowed":
      return {
        titleKey: `auth.${prefix}_provider_disabled`,
        descriptionKey: `auth.${prefix}_provider_disabled_hint`,
      };
    case "auth/account-exists-with-different-credential":
      return { titleKey: "auth.oauth_account_conflict" };
    default:
      return { titleKey: `auth.${prefix}_signin_failed` };
  }
}
