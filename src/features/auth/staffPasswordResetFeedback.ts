import type { ActionCodeSettings } from "firebase/auth";
import { resolvePublicAppBaseUrl } from "@/core/config/publicAppUrl";

/** URL de redirection après réinitialisation (doit être dans les domaines Firebase autorisés). */
export function staffPasswordResetContinueUrl(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : resolvePublicAppBaseUrl();
  return `${origin.replace(/\/$/, "")}/`;
}

export function staffPasswordResetActionCodeSettings(): ActionCodeSettings {
  return {
    url: staffPasswordResetContinueUrl(),
    handleCodeInApp: false,
  };
}

/** Messages explicites — Firebase renvoie souvent auth/unauthorized-continue-uri sans actionCodeSettings. */
export function staffPasswordResetErrorFeedback(
  e: unknown,
  continueOrigin: string
): { title: string; description?: string } {
  const code =
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
      ? (e as { code: string }).code
      : "";
  switch (code) {
    case "auth/operation-not-allowed":
      return {
        title: "Réinitialisation non activée",
        description:
          "Firebase Console → Authentication → Méthode de connexion → E-mail/Mot de passe : activer le fournisseur.",
      };
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
      return {
        title: "Domaine non autorisé pour la réinitialisation",
        description: `Ajoutez ce domaine dans Authentication → Paramètres → Domaines autorisés : ${continueOrigin}`,
      };
    case "auth/invalid-email":
      return { title: "Adresse e-mail invalide" };
    case "auth/missing-email":
      return { title: "Saisissez une adresse e-mail" };
    case "auth/too-many-requests":
      return {
        title: "Trop de demandes",
        description: "Réessayez dans quelques minutes.",
      };
    default:
      return {
        title: "Envoi impossible",
        description: code ? code : undefined,
      };
  }
}
