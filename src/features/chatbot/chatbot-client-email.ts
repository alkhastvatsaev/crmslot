import type * as admin from "firebase-admin";

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/** Extrait la première adresse email d'un message utilisateur. */
export function extractEmailAddressFromText(text: string): string | null {
  const m = text.match(EMAIL_RE);
  if (!m?.[0]) return null;
  return m[0].trim();
}

export function isPlausibleEmail(email: string): boolean {
  const e = email.trim();
  return e.length >= 5 && e.length <= 254 && EMAIL_RE.test(e);
}

/** Message constitué uniquement d'une adresse email (éventuellement ponctuation). */
export function isBareEmailOnlyMessage(text: string): boolean {
  const email = extractEmailAddressFromText(text);
  if (!email) return false;
  const rest = text
    .replace(email, "")
    .replace(/[\s.,;:!?()[\]"'«»]/g, "")
    .trim();
  return rest.length === 0;
}

/**
 * Message où l'utilisateur fournit / enregistre un email (pas seulement « envoie la facture »).
 * Ne pas déclencher sur « @ » seul dans l'adresse — utiliser `isBareEmailOnlyMessage` en plus.
 */
export function looksLikeClientEmailCaptureMessage(text: string): boolean {
  if (!extractEmailAddressFromText(text)) return false;
  if (isBareEmailOnlyMessage(text)) return true;
  const t = text.toLowerCase();
  if (/envo(?:i|y|ie)|transmet|forward|send\b|écri(?:s|re)/i.test(t)) {
    return false;
  }
  return /mail|email|courriel|enregistre|sauve|garde|noter|m[eé]morise|adresse/i.test(t);
}

const EMAIL_CAPTURE_PROMPT_RE =
  /indiquez le nom du client|ouvrez le dossier concerné|redonnez l'adresse email/i;

/** Email donné au tour précédent quand le bot demandait le dossier client. */
export function findPendingEmailFromConversation(
  messages: Array<{ role: string; content?: string | null }> | undefined,
): string | null {
  if (!messages?.length) return null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role !== "assistant" || !m.content) continue;
    if (!EMAIL_CAPTURE_PROMPT_RE.test(m.content)) continue;
    for (let j = i - 1; j >= 0; j -= 1) {
      if (messages[j].role !== "user" || !messages[j].content) continue;
      const email = extractEmailAddressFromText(messages[j].content ?? "");
      if (email) return email;
      break;
    }
  }
  return null;
}

/** Persiste l'email sur le dossier intervention + fiche CRM liée. */
export async function persistInterventionClientEmail(
  firestore: admin.firestore.Firestore,
  companyId: string,
  interventionId: string,
  email: string,
  interventionData?: Record<string, unknown>,
): Promise<{ savedOnIntervention: boolean; savedOnClient: boolean; email: string }> {
  const normalized = email.trim();
  if (!isPlausibleEmail(normalized)) {
    throw new Error("Adresse email invalide");
  }

  let data = interventionData;
  if (!data) {
    const doc = await firestore.collection("interventions").doc(interventionId).get();
    if (!doc.exists) throw new Error("Intervention introuvable");
    data = doc.data()!;
  }
  if (String(data.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }

  let savedOnIntervention = false;
  let savedOnClient = false;
  const existingIv = String(data.clientEmail ?? data.email ?? "")
    .trim()
    .toLowerCase();
  if (existingIv !== normalized.toLowerCase()) {
    await firestore.collection("interventions").doc(interventionId).update({
      clientEmail: normalized,
    });
    savedOnIntervention = true;
  }

  const clientId = String(data.clientId ?? "").trim();
  if (clientId) {
    const clientRef = firestore.collection("clients").doc(clientId);
    const clientDoc = await clientRef.get();
    if (clientDoc.exists) {
      const existingClient = String(clientDoc.data()?.email ?? "")
        .trim()
        .toLowerCase();
      if (existingClient !== normalized.toLowerCase()) {
        await clientRef.update({ email: normalized });
        savedOnClient = true;
      }
    }
  }

  return { savedOnIntervention, savedOnClient, email: normalized };
}
