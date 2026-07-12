import { OAuthProvider, signInWithCredential, type Auth, type UserCredential } from "firebase/auth";
import { createAppleSignInNonce } from "@/core/native/appleOAuthNonce";
import { firebaseAppleOAuthRedirectUri } from "@/core/native/nativeAppleSignIn";
import { loadOAuthSdkScript } from "@/features/auth/oauth/loadOAuthSdkScript";
import { resolveAppleSignInServicesId } from "@/features/auth/oauth/resolveOAuthClientIds";

function createAppleOAuthProvider(): OAuthProvider {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return provider;
}

function mapAppleLocale(locale: string): string {
  if (locale.startsWith("fr")) return "fr_FR";
  if (locale.startsWith("nl")) return "nl_NL";
  return "en_US";
}

type AppleAuthGlobal = {
  auth: {
    init: (config: Record<string, string | boolean>) => void;
    signIn: () => Promise<{
      authorization?: { id_token?: string };
    }>;
  };
};

async function ensureAppleAuthScript(locale: string): Promise<AppleAuthGlobal> {
  const lang = mapAppleLocale(locale);
  await loadOAuthSdkScript(
    `https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/${lang}/appleid.auth.js`,
    `appleid-auth-${lang}`
  );
  const AppleID = (window as unknown as { AppleID?: AppleAuthGlobal }).AppleID;
  if (!AppleID?.auth) throw new Error("apple_identity_unavailable");
  return AppleID;
}

export type AppleWebSignInSession = {
  rawNonce: string;
  cleanup: () => void;
};

/** Initialise Apple JS + bouton officiel dans le conteneur. */
export async function prepareAppleWebSignInButton(
  buttonHost: HTMLElement,
  locale: string
): Promise<AppleWebSignInSession> {
  const clientId = resolveAppleSignInServicesId();
  if (!clientId) throw new Error("apple_services_id_missing");

  const AppleID = await ensureAppleAuthScript(locale);
  const { rawNonce, hashedNonce } = await createAppleSignInNonce();

  AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: firebaseAppleOAuthRedirectUri(),
    state: rawNonce.slice(0, 16),
    nonce: hashedNonce,
    usePopup: true,
  });

  buttonHost.replaceChildren();
  const appleButton = document.createElement("div");
  appleButton.id = "appleid-signin";
  appleButton.setAttribute("class", "apple-sign-in-button");
  appleButton.setAttribute("data-color", "black");
  appleButton.setAttribute("data-border", "false");
  appleButton.setAttribute("data-type", "sign in");
  appleButton.setAttribute("data-mode", "center-align");
  appleButton.setAttribute("data-height", "44");
  appleButton.setAttribute("data-locale", mapAppleLocale(locale));
  appleButton.style.width = "100%";
  appleButton.style.minHeight = "44px";
  buttonHost.appendChild(appleButton);

  return {
    rawNonce,
    cleanup: () => buttonHost.replaceChildren(),
  };
}

export async function completeAppleWebSignInFromIdToken(
  auth: Auth,
  idToken: string,
  rawNonce: string
): Promise<UserCredential> {
  const provider = createAppleOAuthProvider();
  const credential = provider.credential({ idToken, rawNonce });
  return signInWithCredential(auth, credential);
}

type AppleSuccessEvent = CustomEvent<{
  authorization?: { id_token?: string };
}>;

export function bindAppleWebSignInEvents(handlers: {
  onSuccess: (idToken: string) => void;
  onFailure: (error: unknown) => void;
}): () => void {
  const onSuccess = (event: Event) => {
    const idToken = (event as AppleSuccessEvent).detail?.authorization?.id_token?.trim();
    if (!idToken) {
      handlers.onFailure(new Error("apple_signin_missing_identity_token"));
      return;
    }
    handlers.onSuccess(idToken);
  };
  const onFailure = (event: Event) => {
    handlers.onFailure((event as CustomEvent).detail ?? event);
  };

  document.addEventListener("AppleIDSignInOnSuccess", onSuccess);
  document.addEventListener("AppleIDSignInOnFailure", onFailure);
  return () => {
    document.removeEventListener("AppleIDSignInOnSuccess", onSuccess);
    document.removeEventListener("AppleIDSignInOnFailure", onFailure);
  };
}

/** Fallback programmatique (sans bouton SDK). */
export async function signInCrmStaffWithAppleJsSdk(
  auth: Auth,
  locale: string
): Promise<UserCredential> {
  const clientId = resolveAppleSignInServicesId();
  if (!clientId) throw new Error("apple_services_id_missing");

  const AppleID = await ensureAppleAuthScript(locale);
  const { rawNonce, hashedNonce } = await createAppleSignInNonce();

  AppleID.auth.init({
    clientId,
    scope: "name email",
    redirectURI: firebaseAppleOAuthRedirectUri(),
    state: rawNonce.slice(0, 16),
    nonce: hashedNonce,
    usePopup: true,
  });

  const response = await AppleID.auth.signIn();
  const idToken = response.authorization?.id_token?.trim();
  if (!idToken) throw new Error("apple_signin_missing_identity_token");
  return completeAppleWebSignInFromIdToken(auth, idToken, rawNonce);
}
