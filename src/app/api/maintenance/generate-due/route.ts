import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { findDueContracts, buildInterventionDraft, computeNextDueDate } from "@/features/maintenance/generateDueInterventions";
import type { MaintenanceContract } from "@/features/maintenance/types";

export const runtime = "nodejs";

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
