import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import {
  readCurrentAccountRole,
  updateSelfStaffAccount,
} from "@/features/auth/server/updateSelfStaffAccount";
import { isStaffAccountRoleOption } from "@/features/auth/staffAccountRoleDisplay";

export const runtime = "nodejs";

function parseAccountRole(value: unknown) {
  return isStaffAccountRoleOption(value) ? value : undefined;
}

/** Met à jour le profil staff de l'utilisateur connecté. */
export async function PATCH(req: Request) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const db = admin.firestore();
  const companyId = typeof body.companyId === "string" ? body.companyId.trim() : "";
  const result = await updateSelfStaffAccount(db, admin.auth, authResult.uid, {
    firstName: typeof body.firstName === "string" ? body.firstName : undefined,
    lastName: typeof body.lastName === "string" ? body.lastName : undefined,
    phone: typeof body.phone === "string" ? body.phone : body.phone === null ? null : undefined,
    email: typeof body.email === "string" ? body.email : body.email === null ? null : undefined,
    companyId: companyId || undefined,
    accountRole: parseAccountRole(body.accountRole),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  const accountRole = companyId
    ? await readCurrentAccountRole(db, authResult.uid, companyId)
    : parseAccountRole(body.accountRole);

  return NextResponse.json({
    ok: true,
    companyId: companyId || undefined,
    accountRole,
  });
}
