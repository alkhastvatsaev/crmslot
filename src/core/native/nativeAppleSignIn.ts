import { getCapacitorPlatform, isCapacitorNative } from "@/core/native/capacitorRuntime";
import { createAppleSignInNonce } from "@/core/native/appleOAuthNonce";

const NATIVE_APPLE_CLIENT_ID = "com.crmslot.app";

/** Feuille Apple native (ASAuthorization) — pas de redirect Safari / popup web. */
export function shouldUseNativeAppleSignIn(): boolean {
  return isCapacitorNative() && getCapacitorPlatform() === "ios";
}

export function firebaseAppleOAuthRedirectUri(): string {
  const domain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  if (!domain) {
    throw new Error("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required for Sign in with Apple");
  }
  const host = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}/__/auth/handler`;
}

export type NativeAppleAuthorization = {
  identityToken: string;
  rawNonce: string;
};

export class NativeAppleSignInCancelled extends Error {
  override readonly name = "NativeAppleSignInCancelled";
}

function isAppleSignInCancelledError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const code = "code" in e ? String((e as { code?: unknown }).code) : "";
  const message = "message" in e ? String((e as { message?: unknown }).message) : "";
  return (
    code === "1001" ||
    /cancel/i.test(message) ||
    /authorization error/i.test(message) ||
    /user canceled/i.test(message)
  );
}

export async function authorizeNativeAppleSignIn(): Promise<NativeAppleAuthorization> {
  const { rawNonce, hashedNonce } = await createAppleSignInNonce();
  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");

  try {
    const result = await SignInWithApple.authorize({
      clientId: NATIVE_APPLE_CLIENT_ID,
      redirectURI: firebaseAppleOAuthRedirectUri(),
      scopes: "email name",
      state: rawNonce.slice(0, 16),
      nonce: hashedNonce,
    });

    const identityToken = result.response?.identityToken?.trim();
    if (!identityToken) {
      throw new Error("apple_signin_missing_identity_token");
    }
    return { identityToken, rawNonce };
  } catch (e) {
    if (isAppleSignInCancelledError(e)) {
      throw new NativeAppleSignInCancelled();
    }
    throw e;
  }
}
