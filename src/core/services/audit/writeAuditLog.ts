import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";

/**
 * Journal d'audit côté serveur — collection racine `security_audit`.
 * Idempotent : si Admin SDK n'est pas configuré, on log et on no-op (jamais throw vers l'appelant).
 * Les règles Firestore interdisent toute lecture / écriture client — collection 100 % Admin SDK.
 */
export type AuditAction =
  | "intervention.assign"
  | "intervention.delete"
  | "intervention.invoice_change"
  | "company.accept_invite"
  | "company.sync_claims"
  | "supplier.order"
  | "auth.bypass_attempt";

export type AuditLogEntry = {
  action: AuditAction;
  actorUid: string | null;
  companyId?: string | null;
  targetType?: string;
  targetId?: string;
  ip?: string | null;
  userAgent?: string | null;
  /** Détails non sensibles (pas de PII brute, pas de jetons). */
  meta?: Record<string, unknown>;
};

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  if (!isFirebaseAdminReady()) {
    logger.warn("[audit] Firebase Admin non prêt — log ignoré", { action: entry.action });
    return;
  }
  try {
    const db = getAdminDb();
    await db.collection("security_audit").add({
      ...entry,
      actorUid: entry.actorUid ?? null,
      companyId: entry.companyId ?? null,
      at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error("[audit] write failed", {
      action: entry.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Extrait IP + User-Agent d'une `Request` pour enrichir l'entrée audit. */
export function auditMetaFromRequest(request: Request): Pick<AuditLogEntry, "ip" | "userAgent"> {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 240) ?? null;
  return { ip, userAgent };
}
