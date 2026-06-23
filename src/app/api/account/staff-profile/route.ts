import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { updateSelfStaffAccount } from "@/features/auth/server/updateSelfStaffAccount";
import type { CompanyRole } from "@/features/company";

export const runtime = "nodejs";

function parseRole(value: unknown): CompanyRole | undefined {
  if (value === "admin" || value === "collaborateur") return value;
  return undefined;
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
  const result = await updateSelfStaffAccount(db, admin.auth, authResult.uid, {
    firstName: typeof body.firstName === "string" ? body.firstName : undefined,
    lastName: typeof body.lastName === "string" ? body.lastName : undefined,
    phone: typeof body.phone === "string" ? body.phone : body.phone === null ? null : undefined,
    email: typeof body.email === "string" ? body.email : body.email === null ? null : undefined,
    companyId: typeof body.companyId === "string" ? body.companyId : undefined,
    role: parseRole(body.role),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
