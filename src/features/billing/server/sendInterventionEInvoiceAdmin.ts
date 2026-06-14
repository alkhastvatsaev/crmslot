import type * as admin from "firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";
import { isValidInvoiceNumber } from "@/features/billing/invoiceNumbering";
import { getPeppolProvider, type PeppolSendResult } from "@/features/billing/peppol/peppolProvider";
import {
  buildUblInvoiceXml,
  type UblInvoiceInput,
  type UblParty,
} from "@/features/billing/ubl/buildUblInvoiceXml";
import type { Intervention } from "@/features/interventions/types";
import type { DecodedIdToken } from "firebase-admin/auth";

export type SendEInvoiceResult = {
  ublXml: string;
  transmission: PeppolSendResult;
  invoiceNumber: string;
};

function pickString(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Profil e-invoicing de la société depuis `companies/{id}` (champs facultatifs tolérés). */
export function companyToUblSupplier(companyData: Record<string, unknown>): UblParty {
  return {
    name: pickString(companyData, ["name", "companyName", "displayName"]) ?? "Société",
    vatNumber: pickString(companyData, ["vatNumber", "vat", "tva", "billingVatNumber"]),
    street: pickString(companyData, ["addressStreet", "street", "address"]),
    city: pickString(companyData, ["addressCity", "city"]),
    postalZone: pickString(companyData, ["addressZip", "postalCode", "zip"]),
    countryCode: pickString(companyData, ["countryCode"]) ?? "BE",
  };
}

export function interventionToUblInput(
  iv: Intervention,
  supplier: UblParty,
  payeeIban: string | null,
  now: Date = new Date()
): UblInvoiceInput {
  const lines = (iv.billingLines ?? [])
    .filter((l) => l.description.trim() && l.quantity > 0 && l.unitPriceCents > 0)
    .map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
    }));

  const customerName =
    iv.clientCompanyName?.trim() ||
    [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ").trim() ||
    iv.clientName?.trim() ||
    "Client";

  const issueDate = now.toISOString().slice(0, 10);
  const due = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  return {
    invoiceNumber: iv.invoiceNumber ?? iv.id,
    issueDate,
    dueDate: due.toISOString().slice(0, 10),
    supplier,
    customer: { name: customerName, street: iv.address || null, countryCode: "BE" },
    lines,
    vatPercent: 6,
    payeeIban,
    note: iv.problem ?? iv.title ?? null,
  };
}

/**
 * Génère l'UBL d'une intervention facturée et l'envoie via le point d'accès
 * Peppol configuré (mock sans compte). Trace le résultat sur l'intervention.
 */
export async function sendInterventionEInvoiceAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  decoded: DecodedIdToken;
}): Promise<SendEInvoiceResult> {
  const { db, interventionId, actorUid, decoded } = params;

  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) throw new Error("Intervention introuvable.");
  const iv = { id: snap.id, ...snap.data() } as Intervention;

  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) throw new Error("companyId manquant.");

  const allowed = await assertCanAssignInterventionServer(db, actorUid, companyId, decoded);
  if (!allowed) throw new Error("Droits insuffisants pour émettre la facture électronique.");

  if (iv.status !== "invoiced") {
    throw new Error(
      `Facture électronique impossible : statut « ${iv.status} » (attendu : invoiced).`
    );
  }
  if (!isValidInvoiceNumber(iv.invoiceNumber)) {
    throw new Error("Numéro de facture légal manquant — valider d'abord le rapport.");
  }

  const companySnap = await db.collection("companies").doc(companyId).get();
  const companyData = (companySnap.data() ?? {}) as Record<string, unknown>;
  const supplier = companyToUblSupplier(companyData);
  const payeeIban = pickString(companyData, ["iban", "bankIban", "billingIban"]);

  const input = interventionToUblInput(iv, supplier, payeeIban);
  if (input.lines.length === 0) {
    throw new Error("Aucune ligne de facturation valide.");
  }

  const ublXml = buildUblInvoiceXml(input);
  const provider = getPeppolProvider();
  const transmission = await provider.send(ublXml, {
    invoiceNumber: input.invoiceNumber,
    companyId,
    interventionId,
  });

  await db
    .collection("interventions")
    .doc(interventionId)
    .update({
      eInvoice: {
        status: transmission.ok ? "sent" : "error",
        provider: transmission.provider,
        transmissionId: transmission.transmissionId ?? null,
        error: transmission.error ?? null,
        sentAt: new Date().toISOString(),
        sentByUid: actorUid,
      },
    });

  return { ublXml, transmission, invoiceNumber: input.invoiceNumber };
}
