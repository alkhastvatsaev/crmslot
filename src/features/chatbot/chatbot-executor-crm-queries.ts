import { fetchInterventionsForCompany } from "@/features/chatbot/chatbot-intervention-source";
import {
  clientSearchHaystack,
  fetchAllClientsForCompany,
  formatClientRow,
  matchesWorkspaceQuery,
} from "@/features/chatbot/chatbot-workspace-search";
import { parseCreatedAtMs } from "@/features/chatbot/chatbot-intervention-source";
import { db } from "@/features/chatbot/chatbot-executor-db";

export async function listClients(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(50, Math.max(1, Number(input.limit) || 25));
  let rows = await fetchAllClientsForCompany(db(), companyId);

  const search = typeof input.search === "string" ? input.search.trim() : "";
  if (search) {
    rows = rows.filter((r) => matchesWorkspaceQuery(clientSearchHaystack(r), search));
  }

  return rows.slice(0, limit).map(formatClientRow);
}

export async function getClientDetail(companyId: string, clientId: string) {
  const cid = clientId.trim();
  if (!cid) throw new Error("clientId requis");

  const clientRef = db().collection("clients").doc(cid);
  const clientDoc = await clientRef.get();
  if (!clientDoc.exists) throw new Error("Client CRM introuvable");
  const clientData = clientDoc.data()!;
  if (String(clientData.companyId || "") !== companyId) {
    throw new Error("Accès refusé (autre société)");
  }

  const clientRow = formatClientRow({ id: clientDoc.id, ...clientData });

  const [sitesSnap, interventions] = await Promise.all([
    db()
      .collection("sites")
      .where("companyId", "==", companyId)
      .where("clientId", "==", cid)
      .limit(30)
      .get()
      .catch(() => null),
    fetchInterventionsForCompany(db(), companyId, 200),
  ]);

  const linkedInterventions = interventions
    .filter((iv) => String(iv.clientId || "") === cid)
    .slice(0, 40)
    .map((r) => ({
      id: r.id,
      status: r.status,
      address: r.address ?? null,
      problem: r.problem || r.title || null,
      scheduledDate: r.scheduledDate || r.requestedDate || null,
    }));

  return {
    client: clientRow,
    sites:
      sitesSnap?.docs.map((d) => {
        const s = d.data();
        return {
          id: d.id,
          label: s.label ?? null,
          address: s.address ?? null,
        };
      }) ?? [],
    interventions: linkedInterventions,
  };
}

export async function listQuotes(companyId: string, input: Record<string, unknown>) {
  const limit = Math.min(40, Math.max(1, Number(input.limit) || 20));
  const col = db().collection("companies").doc(companyId).collection("quotes");
  const interventionId =
    typeof input.interventionId === "string" ? input.interventionId.trim() : "";

  const snap = interventionId
    ? await col.where("interventionId", "==", interventionId).limit(limit).get()
    : await col.limit(Math.max(limit, 40)).get();

  let rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
    .sort((a, b) => parseCreatedAtMs(b) - parseCreatedAtMs(a));
  const status = typeof input.status === "string" ? input.status.trim() : "";
  if (status) rows = rows.filter((r) => String(r.status) === status);

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    clientName: r.clientName,
    totalCents: r.totalCents,
    interventionId: r.interventionId,
    expiresAt: r.expiresAt,
  }));
}

export async function listTechnicians(companyId: string) {
  const snap = await db().collection("technicians").where("companyId", "==", companyId).get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      uid: data.uid ?? d.id,
      name: data.name || data.displayName || data.email || d.id,
      status: data.status ?? null,
      skills: data.skills ?? [],
    };
  });
}
