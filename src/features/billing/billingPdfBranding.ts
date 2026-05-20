/** Branding bas de page PDF facture/devis (tampon, signature, date). */

export type BillingPdfBranding = {
  companyName: string;
  signerName: string;
  placeName: string;
  issuedAt: Date;
  vatNumber?: string | null;
  addressLine?: string | null;
  /** data:image/png;base64,... ou URL déjà résolue en data URL */
  stampImageDataUrl?: string | null;
  signatureImageDataUrl?: string | null;
};

const STAMP_KEYS = ["billingStampUrl", "invoiceStampUrl", "documentStampUrl"] as const;
const SIGNATURE_KEYS = ["billingSignatureUrl", "invoiceSignatureUrl", "documentSignatureUrl"] as const;

function pickString(data: Record<string, unknown> | undefined, keys: readonly string[]): string | null {
  if (!data) return null;
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export function resolveBillingPdfBrandingFromCompany(
  companyData: Record<string, unknown> | undefined,
  companyId?: string,
): Omit<BillingPdfBranding, "stampImageDataUrl" | "signatureImageDataUrl"> & {
  stampSourceUrl?: string | null;
  signatureSourceUrl?: string | null;
} {
  const companyName =
    (typeof companyData?.name === "string" && companyData.name.trim()) ||
    (typeof companyData?.displayName === "string" && companyData.displayName.trim()) ||
    companyId ||
    "Société";

  const signerName =
    pickString(companyData, ["billingSignerName", "invoiceSignerName", "signerName"]) ||
    companyName;

  const placeName =
    pickString(companyData, ["city", "billingCity", "addressCity"]) ||
    (typeof companyData?.address === "string" && companyData.address.split(",")[0]?.trim()) ||
    "Bruxelles";

  const vatNumber =
    pickString(companyData, ["vatNumber", "vat", "tva", "billingVatNumber"]) ?? null;
  const addressLine =
    (typeof companyData?.address === "string" && companyData.address.trim()) || null;

  return {
    companyName,
    signerName,
    placeName,
    issuedAt: new Date(),
    vatNumber,
    addressLine,
    stampSourceUrl: pickString(companyData, STAMP_KEYS),
    signatureSourceUrl: pickString(companyData, SIGNATURE_KEYS),
  };
}

export async function urlToDataUrl(url: string): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image/")) return trimmed;

  try {
    const res = await fetch(trimmed, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 8) return null;
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function hydrateBillingPdfBranding(
  partial: ReturnType<typeof resolveBillingPdfBrandingFromCompany>,
): Promise<BillingPdfBranding> {
  const [stampImageDataUrl, signatureImageDataUrl] = await Promise.all([
    partial.stampSourceUrl ? urlToDataUrl(partial.stampSourceUrl) : Promise.resolve(null),
    partial.signatureSourceUrl ? urlToDataUrl(partial.signatureSourceUrl) : Promise.resolve(null),
  ]);

  return {
    companyName: partial.companyName,
    signerName: partial.signerName,
    placeName: partial.placeName,
    issuedAt: partial.issuedAt,
    vatNumber: partial.vatNumber,
    addressLine: partial.addressLine,
    stampImageDataUrl,
    signatureImageDataUrl,
  };
}

export async function fetchBillingPdfBrandingForCompany(
  companyData: Record<string, unknown> | undefined,
  companyId: string,
): Promise<BillingPdfBranding> {
  const partial = resolveBillingPdfBrandingFromCompany(companyData, companyId);
  return hydrateBillingPdfBranding(partial);
}
