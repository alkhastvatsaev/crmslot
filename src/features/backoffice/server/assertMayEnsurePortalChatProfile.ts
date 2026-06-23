import type * as admin from "firebase-admin";
import { assertClientMayAccessPortalChat } from "@/features/backoffice/server/assertClientMayAccessPortalChat";
import { companyAcceptsPublicInterventions } from "@/features/backoffice/server/companyAcceptsPublicInterventions";

type Gate = { allowed: true } | { allowed: false; status: number; error: string };

/** Création / mise à jour profil chat portail — invité anonyme si société ouverte au public. */
export async function assertMayEnsurePortalChatProfile(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string
): Promise<Gate> {
  const trimmedUid = uid.trim();
  const trimmedCompany = companyId.trim();
  if (!trimmedUid || !trimmedCompany) {
    return { allowed: false, status: 400, error: "Paramètres invalides." };
  }

  if (await companyAcceptsPublicInterventions(db, trimmedCompany)) {
    return { allowed: true };
  }

  return assertClientMayAccessPortalChat(db, trimmedUid, trimmedCompany);
}
