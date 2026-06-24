import type * as admin from "firebase-admin";
import type { Intervention } from "@/features/interventions/types";
import {
  getTechnicianUnclosedInterventions,
  isTechnicianAcceptAssignmentBlocked,
} from "@/features/interventions/technicianClosureBlock";
import {
  featureFlagsFromEnv,
  mergeFeatureFlags,
  type CrmslotFeatureFlags,
} from "@/core/featureFlags";

export type TechnicianClosureBlockResult =
  | { blocked: false }
  | { blocked: true; blocking: Intervention[] };

export async function isTechnicianClosureBlockEnabledForCompany(
  db: admin.firestore.Firestore,
  companyId: string | null | undefined
): Promise<boolean> {
  const base = featureFlagsFromEnv().technicianClosureBlock;
  const cid = (companyId ?? "").trim();
  if (!cid) return base;
  try {
    const snap = await db
      .collection("companies")
      .doc(cid)
      .collection("featureFlags")
      .doc("flags")
      .get();
    if (!snap.exists) return base;
    const merged = mergeFeatureFlags(
      featureFlagsFromEnv(),
      snap.data() as Partial<CrmslotFeatureFlags>
    );
    return merged.technicianClosureBlock;
  } catch {
    return base;
  }
}

export async function assertTechnicianClosureBlockForAccept(params: {
  db: admin.firestore.Firestore;
  technicianUid: string;
  companyId: string | null | undefined;
  acceptingInterventionId: string;
}): Promise<TechnicianClosureBlockResult> {
  const enabled = await isTechnicianClosureBlockEnabledForCompany(params.db, params.companyId);
  if (!enabled) return { blocked: false };

  const uid = params.technicianUid.trim();
  const acceptingId = params.acceptingInterventionId.trim();
  if (!uid || !acceptingId) return { blocked: false };

  const snap = await params.db
    .collection("interventions")
    .where("assignedTechnicianUid", "==", uid)
    .get();

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention);
  const companyId = (params.companyId ?? "").trim();
  const scoped = companyId ? rows.filter((iv) => (iv.companyId ?? "").trim() === companyId) : rows;

  if (!isTechnicianAcceptAssignmentBlocked(scoped, uid, acceptingId)) {
    return { blocked: false };
  }

  return {
    blocked: true,
    blocking: getTechnicianUnclosedInterventions(scoped, uid, {
      excludeInterventionId: acceptingId,
    }),
  };
}

export function technicianClosureBlockHttpError(
  result: Extract<TechnicianClosureBlockResult, { blocked: true }>
) {
  return {
    ok: false as const,
    error: "Clôturez vos missions en cours avant d'en accepter une nouvelle.",
    code: "TECHNICIAN_CLOSURE_BLOCK" as const,
    blockingIds: result.blocking.map((iv) => iv.id),
  };
}
