import * as admin from "firebase-admin";

/** Champs JSON client → types Admin Firestore (ex. clôture terrain). */
export function coerceAdminExtraPatch(
  extra?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!extra) return undefined;
  const out: Record<string, unknown> = { ...extra };
  const completedAt = out.completedAt;
  if (typeof completedAt === "string" && completedAt.trim()) {
    out.completedAt = admin.firestore.Timestamp.fromDate(new Date(completedAt));
  }
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}
