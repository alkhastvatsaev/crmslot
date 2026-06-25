import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";
import { provisionTechnicianStaffRecord } from "@/features/company/server/provisionTechnicianStaff";
import { syncTenantClaims } from "@/features/company/server/syncTenantClaims";
import { writeAuditLog, auditMetaFromRequest } from "@/core/services/audit/writeAuditLog";

export const runtime = "nodejs";

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function phonesMatch(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ta = a.trim();
  const tb = b.trim();
  const da = digitsOnly(ta);
  const db = digitsOnly(tb);
  if (!da || !db) return false;
  if (da === db) return true;

  if (ta.startsWith("+") && tb.startsWith("+")) return false;

  const stripLeadingZero = (s: string) => s.replace(/^0+/, "");
  const localA = ta.startsWith("+") ? null : stripLeadingZero(da);
  const localB = tb.startsWith("+") ? null : stripLeadingZero(db);
  const e164A = ta.startsWith("+") ? da : null;
  const e164B = tb.startsWith("+") ? db : null;

  if (localA && e164B && localA.length >= 9) return e164B.endsWith(localA);
  if (localB && e164A && localB.length >= 9) return e164A.endsWith(localB);
  return false;
}

function resolveInviteRole(role: unknown): "admin" | "collaborateur" | null {
  if (role === "admin" || role === "collaborateur") return role;
  return null;
}

/**
 * Accepte une invitation : crée le doc membership (Admin SDK, hors rules client).
 * Body : { inviteId: string }
 */
export async function POST(req: Request) {
  if (!admin.apps.length) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin non configuré." },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const tokenStr = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!tokenStr) {
    return NextResponse.json({ ok: false, error: "Token manquant." }, { status: 401 });
  }

  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth().verifyIdToken(tokenStr);
  } catch {
    return NextResponse.json({ ok: false, error: "Token invalide." }, { status: 401 });
  }

  const phoneFromAuth = decoded.phone_number;
  if (!phoneFromAuth) {
    return NextResponse.json(
      { ok: false, error: "Connexion téléphone requise pour accepter l'invitation." },
      { status: 403 }
    );
  }

  let inviteId = "";
  try {
    const body = (await req.json()) as { inviteId?: unknown };
    inviteId = typeof body.inviteId === "string" ? body.inviteId.trim() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide." }, { status: 400 });
  }

  if (!inviteId) {
    return NextResponse.json({ ok: false, error: "inviteId manquant." }, { status: 400 });
  }

  const db = admin.firestore();
  const inviteRef = db.collection("company_invites").doc(inviteId);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) {
    return NextResponse.json({ ok: false, error: "Invitation introuvable." }, { status: 404 });
  }

  const inv = inviteSnap.data() as {
    companyId?: string;
    phone?: string;
    role?: string;
    staffKind?: string;
    firstName?: string;
    lastName?: string;
  };

  const companyId = typeof inv.companyId === "string" ? inv.companyId.trim() : "";
  const invitePhone = typeof inv.phone === "string" ? inv.phone.trim() : "";
  const membershipRole = resolveInviteRole(inv.role) ?? "collaborateur";
  if (!companyId || !invitePhone) {
    return NextResponse.json({ ok: false, error: "Invitation invalide." }, { status: 400 });
  }

  if (!phonesMatch(phoneFromAuth, invitePhone)) {
    return NextResponse.json(
      { ok: false, error: "Ce numéro ne correspond pas à l'invitation." },
      { status: 403 }
    );
  }

  const uid = decoded.uid;

  const existing = await db.collection(`users/${uid}/company_memberships`).doc(companyId).get();
  if (existing.exists) {
    return NextResponse.json({ ok: true, alreadyMember: true, companyId });
  }

  const companySnap = await db.collection("companies").doc(companyId).get();
  const companyName =
    typeof companySnap.data()?.name === "string" ? (companySnap.data()?.name as string) : "Société";

  await db.doc(`users/${uid}/company_memberships/${companyId}`).set({
    companyId,
    role: membershipRole,
    joinedAt: FieldValue.serverTimestamp(),
    companyName,
    active: true,
  });

  await upsertCompanyStaffDirectoryEntry(db, companyId, uid, membershipRole);

  if (inv.staffKind === "technician") {
    await provisionTechnicianStaffRecord(db, {
      uid,
      companyId,
      profile: {
        firstName: typeof inv.firstName === "string" ? inv.firstName : "",
        lastName: typeof inv.lastName === "string" ? inv.lastName : "",
        email: decoded.email ?? null,
      },
    });
  }

  await syncTenantClaims(admin.auth, db, uid, companyId);

  await writeAuditLog({
    action: "company.accept_invite",
    actorUid: uid,
    companyId,
    targetType: "company_invite",
    targetId: inviteId,
    ...auditMetaFromRequest(req),
    meta: { staffKind: inv.staffKind ?? "dispatcher" },
  });

  return NextResponse.json({ ok: true, companyId });
}
