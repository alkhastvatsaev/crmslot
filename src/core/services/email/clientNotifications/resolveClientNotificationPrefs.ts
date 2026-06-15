import { randomUUID } from "crypto";
import { getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";

export type ClientNotificationPrefs = {
  shouldSend: boolean;
  email: string | null;
  unsubscribeToken: string | null;
  reason?: "opted_out" | "no_email" | "client_missing";
};

type ResolveInput = {
  companyId: string;
  clientId?: string | null;
  /** Fallback email si pas de doc client (ex. demande anonyme). */
  fallbackEmail?: string | null;
};

/**
 * Charge les préférences notif client + garantit l'existence d'un unsubscribeToken.
 * Si aucun doc client n'existe, l'email est traité comme transactionnel (envoi OK sans token).
 */
export async function resolveClientNotificationPrefs(
  input: ResolveInput
): Promise<ClientNotificationPrefs> {
  const companyId = input.companyId?.trim();
  const clientId = input.clientId?.trim();
  const fallbackEmail = input.fallbackEmail?.trim() || null;

  if (!companyId) {
    return {
      shouldSend: false,
      email: null,
      unsubscribeToken: null,
      reason: "client_missing",
    };
  }

  if (!clientId) {
    if (!fallbackEmail) {
      return {
        shouldSend: false,
        email: null,
        unsubscribeToken: null,
        reason: "no_email",
      };
    }
    return { shouldSend: true, email: fallbackEmail, unsubscribeToken: null };
  }

  const db = getAdminDb();
  const ref = db.collection("clients").doc(clientId);
  const snap = await ref.get();
  if (!snap.exists) {
    if (fallbackEmail) {
      return { shouldSend: true, email: fallbackEmail, unsubscribeToken: null };
    }
    return {
      shouldSend: false,
      email: null,
      unsubscribeToken: null,
      reason: "client_missing",
    };
  }

  const data = snap.data() ?? {};
  const email = (typeof data.email === "string" && data.email.trim()) || fallbackEmail;
  if (!email) {
    return {
      shouldSend: false,
      email: null,
      unsubscribeToken: null,
      reason: "no_email",
    };
  }

  const optedOut = data.emailNotifications === false;
  if (optedOut) {
    return {
      shouldSend: false,
      email,
      unsubscribeToken: typeof data.unsubscribeToken === "string" ? data.unsubscribeToken : null,
      reason: "opted_out",
    };
  }

  let token = typeof data.unsubscribeToken === "string" ? data.unsubscribeToken : null;
  if (!token) {
    token = randomUUID();
    try {
      await ref.update({ unsubscribeToken: token });
    } catch (err) {
      logger.warn("[notifyClient] unsubscribeToken backfill failed", { clientId, err });
    }
  }

  return { shouldSend: true, email, unsubscribeToken: token };
}
