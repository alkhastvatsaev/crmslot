import type { Intervention } from "@/features/interventions";

// ---------------------------------------------------------------------------
// Demande d'avis Google (GMB) — logique pure anti-spam
// ---------------------------------------------------------------------------

export type GoogleReviewTrigger = "done" | "paid";

export type GoogleReviewCompanyConfig = {
  companyId: string;
  enabled: boolean;
  reviewUrl: string;
  trigger: GoogleReviewTrigger;
  /** Délai minimum après l'événement déclencheur (heures). */
  delayHours: number;
};

export const DEFAULT_GOOGLE_REVIEW_DELAY_HOURS = 48;
export const MIN_GOOGLE_REVIEW_DELAY_HOURS = 24;
export const MAX_GOOGLE_REVIEW_DELAY_HOURS = 168;
/** Ne pas relancer sur des dossiers clôturés depuis plus de 30 jours. */
export const GOOGLE_REVIEW_MAX_AGE_DAYS = 30;
/** Plafond global par exécution cron (sécurité anti-burst). */
export const GOOGLE_REVIEW_MAX_SENDS_PER_RUN = 100;
/** Plafond par société par exécution. */
export const GOOGLE_REVIEW_MAX_SENDS_PER_COMPANY = 20;

const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;
const HTTPS_URL_RE = /^https:\/\/.+/i;

export function buildGoogleReviewUrlFromPlaceId(placeId: string): string {
  const id = placeId.trim();
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(id)}`;
}

export function normalizeGoogleReviewDelayHours(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_GOOGLE_REVIEW_DELAY_HOURS;
  return Math.min(
    MAX_GOOGLE_REVIEW_DELAY_HOURS,
    Math.max(MIN_GOOGLE_REVIEW_DELAY_HOURS, Math.round(n))
  );
}

export function normalizeGoogleReviewTrigger(raw: unknown): GoogleReviewTrigger {
  return raw === "done" ? "done" : "paid";
}

/**
 * Résout la config avis Google depuis un doc Firestore `companies/{id}`.
 * Retourne null si désactivé ou URL invalide.
 */
export function parseGoogleReviewCompanyConfig(
  companyId: string,
  data: Record<string, unknown> | undefined
): GoogleReviewCompanyConfig | null {
  const nested =
    data?.googleReview && typeof data.googleReview === "object"
      ? (data.googleReview as Record<string, unknown>)
      : null;

  const enabled = nested ? nested.enabled === true : data?.googleReviewEnabled === true;
  if (!enabled) return null;

  const reviewUrlRaw =
    (typeof nested?.reviewUrl === "string" && nested.reviewUrl.trim()) ||
    (typeof data?.googleReviewUrl === "string" && data.googleReviewUrl.trim()) ||
    null;
  const placeId =
    (typeof nested?.placeId === "string" && nested.placeId.trim()) ||
    (typeof data?.googlePlaceId === "string" && data.googlePlaceId.trim()) ||
    null;

  let reviewUrl = reviewUrlRaw;
  if (!reviewUrl && placeId && PLACE_ID_RE.test(placeId)) {
    reviewUrl = buildGoogleReviewUrlFromPlaceId(placeId);
  }
  if (!reviewUrl || !HTTPS_URL_RE.test(reviewUrl)) return null;

  const trigger = normalizeGoogleReviewTrigger(nested?.trigger ?? data?.googleReviewTrigger);
  const delayHours = normalizeGoogleReviewDelayHours(
    nested?.delayHours ?? data?.googleReviewDelayHours
  );

  return { companyId, enabled: true, reviewUrl, trigger, delayHours };
}

export type GoogleReviewCandidate = {
  intervention: Pick<
    Intervention,
    | "id"
    | "companyId"
    | "status"
    | "title"
    | "problem"
    | "clientFirstName"
    | "clientLastName"
    | "clientName"
    | "clientId"
    | "clientEmail"
    | "completedAt"
    | "paidAt"
    | "paymentStatus"
    | "googleReviewRequestSentAt"
    | "portalAccessToken"
  >;
  config: GoogleReviewCompanyConfig;
  anchorAt: string;
};

function parseIso(iso: string | null | undefined): Date | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function hoursSince(anchor: Date, now: Date): number {
  return (now.getTime() - anchor.getTime()) / 3_600_000;
}

function isTooOld(anchor: Date, now: Date): boolean {
  const maxAgeMs = GOOGLE_REVIEW_MAX_AGE_DAYS * 24 * 3_600_000;
  return now.getTime() - anchor.getTime() > maxAgeMs;
}

/**
 * Détermine si une intervention est éligible à la demande d'avis (sans envoyer).
 */
export function isEligibleForGoogleReviewRequest(
  iv: GoogleReviewCandidate["intervention"],
  config: GoogleReviewCompanyConfig,
  now: Date = new Date()
): GoogleReviewCandidate | null {
  if (iv.googleReviewRequestSentAt?.trim()) return null;
  if (iv.status === "cancelled") return null;

  const companyId = iv.companyId?.trim();
  if (!companyId || companyId !== config.companyId) return null;

  let anchor: Date | null = null;

  if (config.trigger === "paid") {
    if (iv.paymentStatus !== "paid") return null;
    anchor = parseIso(iv.paidAt);
  } else {
    if (iv.status !== "done" && iv.status !== "invoiced") return null;
    anchor = parseIso(iv.completedAt);
  }

  if (!anchor || isTooOld(anchor, now)) return null;
  if (hoursSince(anchor, now) < config.delayHours) return null;

  return {
    intervention: iv,
    config,
    anchorAt: anchor.toISOString(),
  };
}

/**
 * Filtre une liste d'interventions pour les candidats éligibles.
 */
export function findGoogleReviewCandidates(
  interventions: GoogleReviewCandidate["intervention"][],
  config: GoogleReviewCompanyConfig,
  now: Date = new Date()
): GoogleReviewCandidate[] {
  const results: GoogleReviewCandidate[] = [];
  for (const iv of interventions) {
    const candidate = isEligibleForGoogleReviewRequest(iv, config, now);
    if (candidate) results.push(candidate);
  }
  return results;
}
