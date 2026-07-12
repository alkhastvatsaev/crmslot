import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type AuthProvider,
  type UserCredential,
} from "firebase/auth";
import {
  authorizeNativeAppleSignIn,
  NativeAppleSignInCancelled,
  shouldUseNativeAppleSignIn,
} from "@/core/native/nativeAppleSignIn";
import { isAppleOAuthClient } from "@/core/config/mobileClientDetection";

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

function shouldPreferAppleOAuthPopup(): boolean {
  if (typeof window === "undefined") return false;
  return isAppleOAuthClient({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

async function signInCrmStaffWithProvider(
  auth: Auth,
  provider: AuthProvider,
  options?: { preferPopup?: boolean }
): Promise<UserCredential> {
  try {
    return await signInWithPopup(auth, provider);
  } catch (e) {
    const code = authErrorCode(e);
    const canRedirect =
      !options?.preferPopup &&
      (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request");
    if (canRedirect) {
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
  if (shouldUseNativeAppleSignIn()) {
    return signInCrmStaffWithNativeApple(auth);
  }
  return signInCrmStaffWithAppleWeb(auth);
}

/** Safari / Mac / iPhone web — popup Apple ID native (Touch ID). Firebase gère le nonce. */
async function signInCrmStaffWithAppleWeb(auth: Auth): Promise<UserCredential> {
  const provider = createCrmStaffAppleProvider();
  provider.setCustomParameters({ locale: "fr_FR" });
  return signInCrmStaffWithProvider(auth, provider, {
    preferPopup: shouldPreferAppleOAuthPopup(),
  });
}

async function signInCrmStaffWithNativeApple(auth: Auth): Promise<UserCredential> {
  try {
    const { identityToken, rawNonce } = await authorizeNativeAppleSignIn();
    const provider = createCrmStaffAppleProvider();
    const credential = provider.credential({ idToken: identityToken, rawNonce });
    return await signInWithCredential(auth, credential);
  } catch (e) {
    if (e instanceof NativeAppleSignInCancelled) {
      throw { code: "auth/popup-closed-by-user" };
    }
    throw e;
  }
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
    case "auth/unauthorized-domain":
      return {
        titleKey: `auth.${prefix}_signin_failed`,
        descriptionKey: "auth.oauth_unauthorized_domain_hint",
      };
    case "auth/invalid-oauth-client-id":
    case "auth/invalid-oauth-provider-id":
      return {
        titleKey: `auth.${prefix}_provider_disabled`,
        descriptionKey: `auth.${prefix}_provider_disabled_hint`,
      };
    case "auth/missing-or-invalid-nonce":
      return { titleKey: `auth.${prefix}_signin_failed` };
    case "auth/popup-blocked":
      return {
        titleKey: `auth.${prefix}_signin_failed`,
        descriptionKey: "auth.oauth_popup_blocked_hint",
      };
    default:
      return { titleKey: `auth.${prefix}_signin_failed` };
  }
}
