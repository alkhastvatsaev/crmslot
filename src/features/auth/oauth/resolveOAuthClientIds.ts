/** Client OAuth Google (GIS) — même ID que Firebase Auth Web client. */
export function resolveGoogleOAuthClientId(): string | null {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    null
  );
}

/** Services ID Apple (Sign in with Apple for the web) — Firebase Console → Apple provider. */
export function resolveAppleSignInServicesId(): string | null {
  return process.env.NEXT_PUBLIC_APPLE_SIGN_IN_SERVICES_ID?.trim() || null;
}

export function canUseGoogleIdentityButton(): boolean {
  return Boolean(resolveGoogleOAuthClientId());
}

export function canUseAppleIdentityButton(): boolean {
  return Boolean(resolveAppleSignInServicesId());
}
