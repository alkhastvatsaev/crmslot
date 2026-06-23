import * as admin from "firebase-admin";

export function db(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin non initialisé");
  }
  return admin.firestore();
}

export function parseIsoMs(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "object" && raw !== null && "seconds" in raw) {
    return (raw as { seconds: number }).seconds * 1000;
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const t = Date.parse(String(raw));
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

export function clientLabel(data: Record<string, unknown>): string {
  const parts = [data.clientFirstName, data.clientLastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  if (typeof data.clientName === "string" && data.clientName.trim()) return data.clientName.trim();
  if (typeof data.clientCompanyName === "string" && data.clientCompanyName.trim()) {
    return data.clientCompanyName.trim();
  }
  return String(data.title || "Client");
}

export async function assertInterventionAccess(companyId: string, interventionId: string) {
  const ref = db().collection("interventions").doc(interventionId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Intervention introuvable");
  if (String(doc.data()?.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }
  return doc;
}
