import { doc, updateDoc, type Firestore } from "firebase/firestore";
import type { Intervention } from "@/features/interventions";
import type { ClientRecord, SiteRecord } from "./types";
import { buildClientDisplayName } from "./clientDisplayName";

export type LinkInterventionToClientParams = {
  clientId: string;
  siteId?: string | null;
  client: Pick<
    ClientRecord,
    "displayName" | "firstName" | "lastName" | "companyName" | "phone" | "email"
  >;
  site?: Pick<SiteRecord, "address" | "label" | "lat" | "lng"> | null;
};

/** Patch Firestore intervention avec FK CRM + champs client dénormalisés (rétrocompat). */
export function buildInterventionClientPatch(
  params: LinkInterventionToClientParams
): Partial<Intervention> {
  const display = buildClientDisplayName(params.client);
  const patch: Partial<Intervention> = {
    clientId: params.clientId,
    siteId: params.siteId?.trim() || null,
    clientName: display || null,
    clientFirstName: params.client.firstName?.trim() || null,
    clientLastName: params.client.lastName?.trim() || null,
    clientCompanyName: params.client.companyName?.trim() || null,
    clientPhone: params.client.phone?.trim() || params.client.phone || null,
    clientEmail: params.client.email?.trim() || null,
  };
  if (params.site?.address?.trim()) {
    patch.address = params.site.address.trim();
  }
  if (params.site?.lat != null && params.site?.lng != null) {
    patch.location = { lat: params.site.lat, lng: params.site.lng };
  }
  return patch;
}

export async function linkInterventionToClient(
  db: Firestore,
  interventionId: string,
  params: LinkInterventionToClientParams
): Promise<void> {
  const id = interventionId.trim();
  if (!id) throw new Error("interventionId required");
  await updateDoc(
    doc(db, "interventions", id),
    buildInterventionClientPatch(params) as Record<string, unknown>
  );
}
