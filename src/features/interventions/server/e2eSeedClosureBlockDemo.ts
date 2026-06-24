import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const CLOSURE_BLOCK_DEMO_OPEN_ID = "demo-closure-block-open";
export const CLOSURE_BLOCK_DEMO_OFFER_ID = "demo-closure-block-offer";

export type E2eSeedClosureBlockDemoResult = {
  companyId: string;
  technicianUid: string;
  openInterventionId: string;
  offerInterventionId: string;
};

async function resolveTechnicianUid(
  db: admin.firestore.Firestore,
  companyId: string,
  overrideUid?: string
): Promise<string> {
  const explicit = overrideUid?.trim();
  if (explicit) return explicit;

  const fromEnv =
    process.env.E2E_SEED_TECHNICIAN_UID?.trim() ||
    process.env.NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID?.trim();
  if (fromEnv) return fromEnv;

  const snap = await db
    .collection("technicians")
    .where("companyId", "==", companyId)
    .limit(25)
    .get();

  for (const doc of snap.docs) {
    const authUid = String(doc.data().authUid ?? "").trim();
    if (authUid) return authUid;
  }

  throw new Error(
    `Aucun technicien avec authUid pour la société ${companyId}. Passez technicianUid dans le corps JSON.`
  );
}

function todayScheduleFields(now = new Date()) {
  const scheduledDate = now.toISOString().slice(0, 10);
  return { scheduledDate, requestedDate: scheduledDate };
}

function resolveCompanyId(): string {
  const id =
    process.env.E2E_SEED_COMPANY_ID?.trim() ||
    process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID?.trim();
  if (!id)
    throw new Error("E2E_SEED_COMPANY_ID ou NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID manquant");
  return id;
}

/** Deux missions démo : une ouverte + une offre `assigned` pour tester le blocage clôture. */
export async function e2eSeedClosureBlockDemoAdmin(
  db: admin.firestore.Firestore,
  opts?: { technicianUid?: string }
): Promise<E2eSeedClosureBlockDemoResult> {
  const companyId = resolveCompanyId();
  const technicianUid = await resolveTechnicianUid(db, companyId, opts?.technicianUid);
  const now = new Date().toISOString();
  const schedule = todayScheduleFields();

  const openRef = db.collection("interventions").doc(CLOSURE_BLOCK_DEMO_OPEN_ID);
  const offerRef = db.collection("interventions").doc(CLOSURE_BLOCK_DEMO_OFFER_ID);

  const openPayload: Record<string, unknown> = {
    title: "Démo — mission à clôturer",
    address: "Avenue Louise 100, 1050 Bruxelles",
    time: "09:30",
    scheduledTime: "09:30",
    ...schedule,
    status: "in_progress",
    technicianAcceptedAt: now,
    location: { lat: 50.8342, lng: 4.3641 },
    companyId,
    problem: "Seed démo blocage clôture — mission ouverte",
    clientName: "Client Démo Ouvert",
    clientFirstName: "Client",
    clientLastName: "Ouvert",
    clientPhone: "0470111111",
    category: "serrurerie",
    assignedTechnicianUid: technicianUid,
    assignedAt: now,
    statusUpdatedAt: now,
    completionPhotoUrls: FieldValue.delete(),
    completionSignatureUrl: FieldValue.delete(),
    completedAt: FieldValue.delete(),
    completedByUid: FieldValue.delete(),
  };

  const offerPayload: Record<string, unknown> = {
    title: "Démo — nouvelle offre bloquée",
    address: "Chaussée de Waterloo 200, 1180 Bruxelles",
    time: "11:00",
    scheduledTime: "11:00",
    ...schedule,
    status: "assigned",
    technicianAcceptedAt: FieldValue.delete(),
    location: { lat: 50.7992, lng: 4.3489 },
    companyId,
    problem: "Seed démo blocage clôture — nouvelle assignation",
    clientName: "Client Démo Offre",
    clientFirstName: "Client",
    clientLastName: "Offre",
    clientPhone: "0470222222",
    category: "serrurerie",
    assignedTechnicianUid: technicianUid,
    assignedAt: now,
    statusUpdatedAt: now,
    completionPhotoUrls: FieldValue.delete(),
    completionSignatureUrl: FieldValue.delete(),
    completedAt: FieldValue.delete(),
    completedByUid: FieldValue.delete(),
  };

  const openExists = (await openRef.get()).exists;
  const offerExists = (await offerRef.get()).exists;

  if (!openExists) {
    const {
      completionPhotoUrls: _op,
      completionSignatureUrl: _os,
      completedAt: _oc,
      completedByUid: _ou,
      ...createOpen
    } = openPayload;
    void _op;
    void _os;
    void _oc;
    void _ou;
    await openRef.set({ ...createOpen, createdAt: FieldValue.serverTimestamp() });
  } else {
    await openRef.set(openPayload, { merge: true });
  }

  if (!offerExists) {
    const {
      completionPhotoUrls: _fp,
      completionSignatureUrl: _fs,
      completedAt: _fc,
      completedByUid: _fu,
      technicianAcceptedAt: _ft,
      ...createOffer
    } = offerPayload;
    void _fp;
    void _fs;
    void _fc;
    void _fu;
    void _ft;
    await offerRef.set({ ...createOffer, createdAt: FieldValue.serverTimestamp() });
  } else {
    await offerRef.set(offerPayload, { merge: true });
  }

  return {
    companyId,
    technicianUid,
    openInterventionId: CLOSURE_BLOCK_DEMO_OPEN_ID,
    offerInterventionId: CLOSURE_BLOCK_DEMO_OFFER_ID,
  };
}
