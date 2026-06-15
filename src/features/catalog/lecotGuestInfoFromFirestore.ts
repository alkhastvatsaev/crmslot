import * as admin from "firebase-admin";
import type { LecotGuestInfo } from "@/features/catalog/lecotPlaywrightScraper";

function pick(data: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function parseStreet(address: string): string {
  return address.split(",")[0]?.trim() ?? address;
}

function parseCity(address: string): string {
  const part = address.split(",")[1] ?? "";
  return part.replace(/^\s*\d{4,5}\s*/, "").trim();
}

function parsePostal(address: string): string {
  const part = address.split(",")[1] ?? address;
  return part.match(/\b(\d{4,5})\b/)?.[1] ?? "";
}

/**
 * Loads guest checkout info for Lecot.be from the company Firestore doc.
 * Env vars override each field individually.
 */
export async function loadLecotGuestInfo(companyId: string): Promise<LecotGuestInfo> {
  const snap = await admin.firestore().doc(`companies/${companyId}`).get();
  const d = snap.exists ? (snap.data() as Record<string, unknown>) : {};

  const address = pick(d, "address", "billingAddress", "addressLine");

  return {
    firstName:
      process.env.LECOT_CONTACT_FIRST_NAME?.trim() ||
      pick(d, "contactFirstName", "ownerFirstName", "signerFirstName") ||
      "Contact",
    lastName:
      process.env.LECOT_CONTACT_LAST_NAME?.trim() ||
      pick(d, "contactLastName", "ownerLastName", "signerLastName") ||
      "Crmslot",
    companyName: pick(d, "name", "displayName", "companyName") || "Société",
    email:
      process.env.LECOT_CONTACT_EMAIL?.trim() ||
      pick(d, "email", "contactEmail", "billingEmail", "invoiceEmail"),
    phone:
      process.env.LECOT_CONTACT_PHONE?.trim() ||
      pick(d, "phone", "contactPhone", "telephone", "billingPhone"),
    street:
      process.env.LECOT_CONTACT_STREET?.trim() ||
      pick(d, "street", "addressStreet") ||
      parseStreet(address),
    city:
      process.env.LECOT_CONTACT_CITY?.trim() ||
      pick(d, "city", "billingCity", "addressCity") ||
      parseCity(address),
    postalCode:
      process.env.LECOT_CONTACT_POSTAL?.trim() ||
      pick(d, "postalCode", "zipCode", "postCode", "billingPostalCode") ||
      parsePostal(address),
    vatNumber: pick(d, "vatNumber", "vat", "tva", "billingVatNumber") || null,
  };
}
