export type PortalAccessSessionCase = {
  id: string;
  status?: string;
  title?: string;
  problem?: string;
  createdAt?: string | null;
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientCompanyName?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  requestedDate?: string | null;
  requestedTime?: string | null;
  invoicePdfUrl?: string | null;
  paymentStatus?: string | null;
  invoiceAmountCents?: number | null;
  stripePaymentLinkUrl?: string | null;
  clientRating?: number | null;
  clientComment?: string | null;
};

export type PortalAccessSession = {
  emailNormalized: string;
  verifiedAt: string;
  interventionIds: string[];
  interventions: PortalAccessSessionCase[];
};

const STORAGE_KEY = "bm_portal_access_session_v2";

export function readPortalAccessSession(): PortalAccessSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PortalAccessSession;
    if (!parsed.emailNormalized || !Array.isArray(parsed.interventionIds)) return null;
    return {
      ...parsed,
      interventions: Array.isArray(parsed.interventions) ? parsed.interventions : [],
    };
  } catch {
    return null;
  }
}

export function writePortalAccessSession(session: PortalAccessSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}
