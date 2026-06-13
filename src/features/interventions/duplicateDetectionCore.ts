import type { Intervention } from "@/features/interventions/types";
import {
  DUPLICATE_DETECTION_WINDOW_MS,
  DUPLICATE_PROBLEM_SIMILARITY_MIN,
} from "@/features/interventions/interventionDuplicateConstants";
import { unknownTimestampToMs } from "@/features/backoffice/timeHelpers";

/** Adresse normalisée pour comparaison « même rue ». */
export function normalizeAddressForDedupe(raw: string): string {
  const s = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  return s;
}

export function problemTextForDedupe(iv: Pick<Intervention, "problem" | "title">): string {
  const p = (iv.problem ?? "").trim();
  if (p) return p;
  return (iv.title ?? "").trim();
}

function tokenize(text: string): Set<string> {
  const t = normalizeAddressForDedupe(text)
    .split(" ")
    .filter((w) => w.length > 2);
  return new Set(t);
}

/** Similarité Jaccard entre deux ensembles de tokens (0–1). */
export function jaccardTokenSimilarity(a: string, b: string): number {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter += 1;
  }
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function interventionCreatedAtMs(iv: Intervention): number | null {
  const ms = unknownTimestampToMs(iv.createdAt as unknown);
  if (ms != null) return ms;
  return null;
}

export function formatDuplicateRelativeCreated(createdAtMs: number, now = Date.now()): string {
  const diff = Math.max(0, now - createdAtMs);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  return `il y a ${days} jours`;
}

export type DuplicateClientIdentity = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
};

export function normalizePhoneForDedupe(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9) return digits.slice(-9);
  return digits;
}

export function normalizeEmailForDedupe(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalizeNamePartForDedupe(raw: string): string {
  return normalizeAddressForDedupe(raw.trim());
}

export function extractClientIdentityFromIntervention(
  iv: Pick<
    Intervention,
    "clientFirstName" | "clientLastName" | "clientName" | "clientPhone" | "clientEmail" | "phone"
  >
): DuplicateClientIdentity {
  let firstName = (iv.clientFirstName ?? "").trim();
  let lastName = (iv.clientLastName ?? "").trim();
  if (!firstName && !lastName && iv.clientName?.trim()) {
    const parts = iv.clientName.trim().split(/\s+/);
    firstName = parts[0] ?? "";
    lastName = parts.slice(1).join(" ");
  }
  return {
    firstName,
    lastName,
    phone: (iv.clientPhone ?? iv.phone ?? "").trim(),
    email: (iv.clientEmail ?? "").trim(),
  };
}

/** Vrai si les identités client sont clairement distinctes — pas un doublon. */
export function clientIdentitiesConflict(
  a: DuplicateClientIdentity,
  b: DuplicateClientIdentity
): boolean {
  const phoneA = normalizePhoneForDedupe(a.phone ?? "");
  const phoneB = normalizePhoneForDedupe(b.phone ?? "");
  if (phoneA.length >= 9 && phoneB.length >= 9 && phoneA !== phoneB) return true;

  const emailA = normalizeEmailForDedupe(a.email ?? "");
  const emailB = normalizeEmailForDedupe(b.email ?? "");
  if (emailA.length >= 3 && emailB.length >= 3 && emailA !== emailB) return true;

  const fnA = normalizeNamePartForDedupe(a.firstName ?? "");
  const fnB = normalizeNamePartForDedupe(b.firstName ?? "");
  if (fnA.length >= 2 && fnB.length >= 2 && fnA !== fnB) return true;

  const lnA = normalizeNamePartForDedupe(a.lastName ?? "");
  const lnB = normalizeNamePartForDedupe(b.lastName ?? "");
  if (lnA.length >= 2 && lnB.length >= 2 && lnA !== lnB) return true;

  return false;
}

export function clientIdentityMatchHints(
  a: DuplicateClientIdentity,
  b: DuplicateClientIdentity
): string[] {
  const hints: string[] = [];
  const phoneA = normalizePhoneForDedupe(a.phone ?? "");
  const phoneB = normalizePhoneForDedupe(b.phone ?? "");
  if (phoneA.length >= 9 && phoneB.length >= 9 && phoneA === phoneB) hints.push("même téléphone");

  const emailA = normalizeEmailForDedupe(a.email ?? "");
  const emailB = normalizeEmailForDedupe(b.email ?? "");
  if (emailA.length >= 3 && emailB.length >= 3 && emailA === emailB) hints.push("même e-mail");

  const fnA = normalizeNamePartForDedupe(a.firstName ?? "");
  const fnB = normalizeNamePartForDedupe(b.firstName ?? "");
  const lnA = normalizeNamePartForDedupe(a.lastName ?? "");
  const lnB = normalizeNamePartForDedupe(b.lastName ?? "");
  if (fnA && fnB && fnA === fnB) hints.push("même prénom");
  if (lnA && lnB && lnA === lnB) hints.push("même nom");

  return hints;
}

export type FindDuplicateParams = {
  excludeId: string;
  address: string;
  problem: string;
  client?: DuplicateClientIdentity;
  candidates: Intervention[];
  windowMs?: number;
  now?: number;
  similarityMin?: number;
};

/**
 * Trouve la meilleure intervention « doublon » dans la fenêtre temporelle :
 * même adresse normalisée + similarité texte du problème ≥ seuil.
 */
export function findPotentialDuplicateAmong(params: FindDuplicateParams): Intervention | null {
  const {
    excludeId,
    address,
    problem,
    client,
    candidates,
    windowMs = DUPLICATE_DETECTION_WINDOW_MS,
    now = Date.now(),
    similarityMin = DUPLICATE_PROBLEM_SIMILARITY_MIN,
  } = params;

  const addrNorm = normalizeAddressForDedupe(address.trim());
  if (!addrNorm || addrNorm === "adresse inconnue") return null;

  const probRaw = problem.trim();
  if (!probRaw) return null;

  let best: { iv: Intervention; score: number; createdMs: number } | null = null;

  for (const iv of candidates) {
    if (iv.id === excludeId) continue;
    const ms = interventionCreatedAtMs(iv);
    if (ms == null || ms > now || now - ms > windowMs) continue;

    const ivAddr = normalizeAddressForDedupe(iv.address ?? "");
    if (!ivAddr || ivAddr !== addrNorm) continue;

    if (client && clientIdentitiesConflict(client, extractClientIdentityFromIntervention(iv))) {
      continue;
    }

    const ivProb = problemTextForDedupe(iv);
    const score = jaccardTokenSimilarity(probRaw, ivProb || iv.title || "");
    if (score < similarityMin) continue;

    if (!best || score > best.score || (score === best.score && ms > best.createdMs)) {
      best = { iv, score, createdMs: ms };
    }
  }

  return best?.iv ?? null;
}
