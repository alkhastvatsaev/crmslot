import type * as admin from "firebase-admin";
import { buildClientDisplayName } from "@/features/clients/clientDisplayName";
import type { ClientRecord } from "@/features/clients/types";
import { fetchInterventionsForCompany } from "@/features/chatbot/chatbot-intervention-source";

export function matchesWorkspaceQuery(haystack: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  return haystack.toLowerCase().includes(q);
}

export function clientSearchHaystack(row: Record<string, unknown>): string {
  const asClient = row as Pick<
    ClientRecord,
    "displayName" | "firstName" | "lastName" | "companyName" | "phone" | "email"
  > & { name?: string };
  return [
    buildClientDisplayName(asClient),
    row.displayName,
    row.name,
    row.firstName,
    row.lastName,
    row.companyName,
    row.phone,
    row.email,
  ]
    .filter(Boolean)
    .join(" ");
}

export function interventionSearchHaystack(row: Record<string, unknown>): string {
  return [
    row.clientName,
    row.clientFirstName,
    row.clientLastName,
    row.clientCompanyName,
    row.clientPhone,
    row.phone,
    row.clientEmail,
    row.email,
    row.title,
    row.problem,
    row.address,
    row.id,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Tous les clients société (index companyId + displayName), max 500. */
export async function fetchAllClientsForCompany(
  firestore: admin.firestore.Firestore,
  companyId: string,
  maxDocs = 500,
): Promise<Record<string, unknown>[]> {
  const snap = await firestore
    .collection("clients")
    .where("companyId", "==", companyId)
    .limit(maxDocs)
    .get();

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>));
  return rows.sort((a, b) => String(a.displayName || "").localeCompare(String(b.displayName || "")));
}

export function formatClientRow(r: Record<string, unknown>) {
  const asClient = r as Pick<
    ClientRecord,
    "displayName" | "firstName" | "lastName" | "companyName" | "phone" | "email"
  >;
  return {
    id: r.id,
    displayName: buildClientDisplayName(asClient) || String(r.displayName || r.name || ""),
    firstName: r.firstName ?? null,
    lastName: r.lastName ?? null,
    companyName: r.companyName ?? null,
    phone: r.phone ?? null,
    email: r.email ?? null,
    source: "crm" as const,
  };
}

export function formatInterventionSearchHit(r: Record<string, unknown>) {
  const parts = [r.clientFirstName, r.clientLastName].filter(Boolean).join(" ").trim();
  const client =
    (typeof r.clientName === "string" && r.clientName.trim()) ||
    parts ||
    (typeof r.clientCompanyName === "string" ? r.clientCompanyName.trim() : "") ||
    "Client";
  return {
    id: r.id,
    status: r.status,
    client,
    address: r.address ?? null,
    problem: r.problem || r.title || null,
    scheduledDate: r.scheduledDate || r.requestedDate || null,
    clientId: r.clientId ?? null,
    source: "intervention" as const,
  };
}

export async function searchWorkspace(
  firestore: admin.firestore.Firestore,
  companyId: string,
  query: string,
  limit = 25,
): Promise<{
  query: string;
  clients: ReturnType<typeof formatClientRow>[];
  interventions: ReturnType<typeof formatInterventionSearchHit>[];
  quotes: Array<{
    id: unknown;
    clientName: unknown;
    status: unknown;
    interventionId: unknown;
    totalCents: unknown;
  }>;
  note: string | null;
}> {
  const q = query.trim();
  if (!q) throw new Error("query requis (nom, téléphone, email, adresse…)");

  const cap = Math.min(40, Math.max(1, limit));

  const [allClients, interventions, quotesSnap] = await Promise.all([
    fetchAllClientsForCompany(firestore, companyId),
    fetchInterventionsForCompany(firestore, companyId, 200),
    firestore.collection("companies").doc(companyId).collection("quotes").limit(100).get(),
  ]);

  const clients = allClients
    .filter((r) => matchesWorkspaceQuery(clientSearchHaystack(r), q))
    .slice(0, cap)
    .map(formatClientRow);

  const ivHits = interventions
    .filter((r) => matchesWorkspaceQuery(interventionSearchHaystack(r), q))
    .slice(0, cap)
    .map(formatInterventionSearchHit);

  const quotes = quotesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown>))
    .filter((r) =>
      matchesWorkspaceQuery(
        [r.clientName, r.title, r.interventionId].filter(Boolean).join(" "),
        q,
      ),
    )
    .slice(0, cap)
    .map((r) => ({
      id: r.id,
      clientName: r.clientName ?? null,
      status: r.status ?? null,
      interventionId: r.interventionId ?? null,
      totalCents: r.totalCents ?? null,
    }));

  let note: string | null = null;
  if (clients.length === 0 && ivHits.length > 0) {
    note =
      "Aucune fiche CRM ; le nom apparaît sur des interventions (client pas encore enregistré dans le carnet contacts).";
  } else if (clients.length === 0 && ivHits.length === 0 && quotes.length === 0) {
    note = `Aucun résultat pour « ${q} » dans CRM, interventions et devis de cette société.`;
  }

  return { query: q, clients, interventions: ivHits, quotes, note };
}
