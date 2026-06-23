import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { isFirebaseAdminReady } from "@/core/config/firebase-admin";
import {
  findDueContracts,
  buildInterventionDraft,
  computeNextDueDate,
} from "@/features/maintenance/generateDueInterventions";
import { generateDueInterventionsAdmin } from "@/features/maintenance";
import type { MaintenanceContract } from "@/features/maintenance";

export const runtime = "nodejs";

/**
 * GET /api/maintenance/generate-due — job cron Vercel (vercel.json crons).
 * Auth : `Authorization: Bearer ${CRON_SECRET}` (header envoyé par Vercel Cron)
 * ou `x-cron-secret` pour un déclenchement manuel.
 * Lit Firestore Admin, crée les interventions dues et avance les contrats.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const bearer = request.headers.get("authorization")?.trim();
  const headerSecret = request.headers.get("x-cron-secret")?.trim();
  const isAuthorizedCron =
    Boolean(cronSecret) && (bearer === `Bearer ${cronSecret}` || headerSecret === cronSecret);

  if (!isAuthorizedCron) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const result = await generateDueInterventionsAdmin();
  return NextResponse.json({ ok: true, ...result });
}

/**
 * POST /api/maintenance/generate-due
 * Body: { contracts: MaintenanceContract[] }
 * Returns: { drafts, updatedContracts }
 *
 * Appeler depuis un cron Vercel (vercel.json crons) avec le secret CRON_SECRET.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const incomingSecret = request.headers.get("x-cron-secret")?.trim();
  const isAuthorizedCron = cronSecret && incomingSecret === cronSecret;

  if (!isAuthorizedCron) {
    const auth = await requireAuthenticatedUser(request);
    if ("response" in auth) return auth.response;
  }

  let contracts: MaintenanceContract[];
  try {
    const body = (await request.json()) as { contracts?: unknown };
    if (!Array.isArray(body.contracts)) {
      return NextResponse.json({ ok: false, error: "contracts must be an array" }, { status: 400 });
    }
    contracts = body.contracts as MaintenanceContract[];
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const due = findDueContracts(contracts);
  const drafts = due.map(buildInterventionDraft);
  const updatedContracts = due.map((c) => ({
    id: c.id,
    nextDueDate: computeNextDueDate(c),
  }));

  return NextResponse.json({ ok: true, drafts, updatedContracts });
}
