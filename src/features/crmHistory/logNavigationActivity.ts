import { addDoc, collection, type Firestore } from "firebase/firestore";
import type { CompanyCrmActivityDoc, CompanyCrmActivityKind } from "./crmActivityLog";

export const PAGE_NAMES: Record<number, string> = {
  0: "Carte",
  1: "Espace société",
  2: "Hub technicien",
  3: "Gmail",
  4: "Matériel entreprise",
  5: "Quality Management",
  6: "Facturation",
};

function crmActivityCol(db: Firestore, companyId: string) {
  return collection(db, "companies", companyId.trim(), "crm_activity");
}

function navPayload(
  companyId: string,
  kind: CompanyCrmActivityKind,
  actorUid: string,
  note: string,
  extra: Partial<CompanyCrmActivityDoc> = {}
): CompanyCrmActivityDoc {
  return {
    companyId: companyId.trim(),
    kind,
    at: new Date().toISOString(),
    actorUid,
    actorRole: "dispatcher",
    note,
    ...extra,
  };
}

export async function logPageNavigation(
  db: Firestore,
  companyId: string,
  actorUid: string,
  pageIndex: number
): Promise<void> {
  const name = PAGE_NAMES[pageIndex] ?? `Page ${pageIndex}`;
  await addDoc(
    crmActivityCol(db, companyId),
    navPayload(companyId, "page_navigated", actorUid, name)
  );
}

export async function logInterventionViewed(
  db: Firestore,
  companyId: string,
  actorUid: string,
  iv: { id: string; title?: string | null; clientName?: string | null; address?: string | null }
): Promise<void> {
  await addDoc(
    crmActivityCol(db, companyId),
    navPayload(companyId, "intervention_viewed", actorUid, iv.title ?? iv.id, {
      interventionId: iv.id,
      interventionTitle: iv.title ?? null,
      clientName: iv.clientName ?? null,
      address: iv.address ?? null,
    })
  );
}

export async function logEmailViewed(
  db: Firestore,
  companyId: string,
  actorUid: string,
  subject: string
): Promise<void> {
  await addDoc(
    crmActivityCol(db, companyId),
    navPayload(companyId, "email_viewed", actorUid, subject)
  );
}

export async function logUserSessionStart(
  db: Firestore,
  companyId: string,
  actorUid: string
): Promise<void> {
  await addDoc(
    crmActivityCol(db, companyId),
    navPayload(companyId, "user_session_start", actorUid, "Connexion")
  );
}

export async function logCustomNavNote(
  db: Firestore,
  companyId: string,
  actorUid: string,
  note: string
): Promise<void> {
  await addDoc(
    crmActivityCol(db, companyId),
    navPayload(companyId, "page_navigated", actorUid, note)
  );
}
