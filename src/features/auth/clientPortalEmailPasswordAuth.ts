export function emailPasswordAuthErrorFeedback(e: unknown): {
  titleKey: string;
  descriptionKey?: string;
} {
  if (e instanceof Error && e.name === "ClientPortalEmailNotVerifiedError") {
    return {
      titleKey: "auth.email_not_verified",
      descriptionKey: "auth.verification_email_sent_hint",
    };
  }

  const code =
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
      ? (e as { code: string }).code
      : "";

  switch (code) {
    case "auth/invalid-email":
      return { titleKey: "auth.invalid_email" };
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return { titleKey: "auth.invalid_credentials" };
    case "auth/email-already-in-use":
      return { titleKey: "auth.email_already_in_use" };
    case "auth/weak-password":
      return { titleKey: "auth.weak_password" };
    case "auth/too-many-requests":
      return { titleKey: "auth.too_many_requests" };
    case "auth/operation-not-allowed":
      return {
        titleKey: "auth.email_password_disabled",
        descriptionKey: "auth.email_password_disabled_hint",
      };
    default:
      return { titleKey: "auth.signin_failed" };
  }
}
