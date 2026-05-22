import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential,
} from "firebase/auth";

/** Connexion Google lancée en redirect — la page sera rechargée par Firebase. */
export class ClientPortalGoogleRedirectPending extends Error {
  override readonly name = "ClientPortalGoogleRedirectPending";
}

function authErrorCode(e: unknown): string {
  if (e !== null && typeof e === "object" && "code" in e && typeof (e as { code: unknown }).code === "string") {
    return (e as { code: string }).code;
  }
  return "";
}

export function createClientPortalGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

/** Popup Google ; si bloquée, bascule sur redirect (finalisé par `getRedirectResult`). */
export async function signInClientPortalWithGoogle(auth: Auth): Promise<UserCredential> {
  const provider = createClientPortalGoogleProvider();
  try {
    return await signInWithPopup(auth, provider);
  } catch (e) {
    const code = authErrorCode(e);
    if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
      await signInWithRedirect(auth, provider);
      throw new ClientPortalGoogleRedirectPending();
    }
    throw e;
  }
}

export function clientPortalGoogleSignInErrorFeedback(e: unknown): {
  titleKey: string;
  descriptionKey?: string;
} {
  if (e instanceof ClientPortalGoogleRedirectPending) {
    return { titleKey: "auth.google_redirect" };
  }
  const code = authErrorCode(e);
  switch (code) {
    case "auth/popup-closed-by-user":
      return { titleKey: "auth.google_signin_cancelled" };
    case "auth/operation-not-allowed":
      return {
        titleKey: "auth.google_provider_disabled",
        descriptionKey: "auth.google_provider_disabled_hint",
      };
    case "auth/account-exists-with-different-credential":
      return { titleKey: "auth.google_account_conflict" };
    default:
      return { titleKey: "auth.google_signin_failed" };
  }
}
