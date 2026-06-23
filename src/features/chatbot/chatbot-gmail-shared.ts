import { getAdminDb } from "@/core/config/firebase-admin";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";

export const MAX_GMAIL_LIST = 20;
export const MAX_GMAIL_BODY_CHARS = 4500;

export async function assertGmailReady(): Promise<void> {
  if (!(await isGmailOAuthConfigured())) {
    throw new Error(
      "Gmail non connecté : connectez Gmail depuis la page 6 (bouton Google) ou configurez OAuth côté serveur."
    );
  }
}

export function parseSenderEmail(from: string): string {
  return (
    from
      .match(/<([^>]+)>/)?.[1]
      ?.trim()
      .toLowerCase() || from.trim().toLowerCase()
  );
}

export async function assertInterventionAccess(companyId: string, interventionId: string) {
  const doc = await getAdminDb().collection("interventions").doc(interventionId).get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  if (String(doc.data()?.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }
}
