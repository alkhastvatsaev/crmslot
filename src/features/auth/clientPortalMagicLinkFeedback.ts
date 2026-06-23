/** Messages explicites — Firebase renvoie souvent auth/operation-not-allowed ou unauthorized-continue-uri. */
export function magicLinkSendErrorFeedback(
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
        title: "Connexion par lien non activée",
        description:
          "Firebase Console → Authentication → Méthode de connexion → E-mail : activer « Lien par e-mail (connexion sans mot de passe) ».",
      };
    case "auth/unauthorized-continue-uri":
    case "auth/invalid-continue-uri":
      return {
        title: "Domaine non autorisé pour le lien",
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
