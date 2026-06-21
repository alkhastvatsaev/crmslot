import type * as admin from "firebase-admin";
import {
  acceptQuoteAdmin,
  type AcceptQuoteAdminResult,
} from "@/features/quotes/server/acceptQuoteAdmin";
import { declineQuoteAdmin } from "@/features/quotes/server/declineQuoteAdmin";
import { findInterventionByPortalToken } from "@/features/interventions/server/portalLookupAdmin";
import { notifyCompanyAdminsPush } from "@/features/notifications/notifyCompanyAdminsPush";
import type { Quote } from "@/features/quotes/types";

export type PortalQuoteRespondAction = "accept" | "decline";

export type PortalQuoteRespondResult =
  | ({ action: "accept" } & AcceptQuoteAdminResult)
  | { action: "decline" };

async function loadQuoteForPortal(
  db: admin.firestore.Firestore,
  companyId: string,
  quoteId: string,
  interventionId: string
): Promise<Quote> {
  const quoteSnap = await db
    .collection("companies")
    .doc(companyId)
    .collection("quotes")
    .doc(quoteId)
    .get();
  if (!quoteSnap.exists) {
    throw new Error("Devis introuvable.");
  }
  const quote = { id: quoteSnap.id, ...quoteSnap.data() } as Quote;
  if (quote.interventionId?.trim() !== interventionId) {
    throw new Error("Ce devis n'est pas lié à votre dossier.");
  }
  if (quote.companyId && quote.companyId !== companyId) {
    throw new Error("Devis hors société.");
  }
  return quote;
}

async function logPortalQuoteTimeline(
  db: admin.firestore.Firestore,
  interventionId: string,
  companyId: string | null | undefined,
  content: string
): Promise<void> {
  const at = new Date().toISOString();
  await db
    .collection("interventions")
    .doc(interventionId)
    .collection("timeline_events")
    .add({
      interventionId,
      type: "comment",
      content,
      visibility: "client",
      createdAt: at,
      createdByUid: "portal",
      companyId: companyId ?? null,
    });
}

export async function respondQuoteViaPortalAdmin(params: {
  db: admin.firestore.Firestore;
  portalToken: string;
  quoteId: string;
  action: PortalQuoteRespondAction;
}): Promise<PortalQuoteRespondResult> {
  const { db, portalToken, quoteId, action } = params;
  const iv = await findInterventionByPortalToken(db, portalToken);
  if (!iv) {
    throw new Error("Lien invalide ou expiré.");
  }

  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) {
    throw new Error("Dossier incomplet.");
  }

  await loadQuoteForPortal(db, companyId, quoteId, iv.id);

  const ivTitle = (iv.title ?? "Dossier").trim() || "Dossier";

  if (action === "accept") {
    const result = await acceptQuoteAdmin({
      db,
      companyId,
      quoteId,
      actorUid: "portal",
    });
    await logPortalQuoteTimeline(
      db,
      iv.id,
      companyId,
      "Devis accepté par le client via le portail"
    );
    // Admin doit transformer en intervention / lancer la suite.
    void notifyCompanyAdminsPush({
      companyId,
      title: "Devis accepté",
      body: `${ivTitle} — à transformer en intervention`,
      data: {
        type: "quote_accepted",
        bmInterventionId: iv.id,
        quoteId,
      },
    }).catch(() => {});
    return { action: "accept", ...result };
  }

  await declineQuoteAdmin({ db, companyId, quoteId });
  await logPortalQuoteTimeline(db, iv.id, companyId, "Devis refusé par le client via le portail");
  // Admin doit relancer / proposer alternative.
  void notifyCompanyAdminsPush({
    companyId,
    title: "Devis refusé",
    body: `${ivTitle} — relance commerciale`,
    data: {
      type: "quote_declined",
      bmInterventionId: iv.id,
      quoteId,
    },
  }).catch(() => {});
  return { action: "decline" };
}
