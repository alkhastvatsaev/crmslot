import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type * as admin from "firebase-admin";
import { syncTenantClaims } from "@/features/company/server/syncTenantClaims";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

function deriveCompanyName(email: string | null | undefined): string {
  const local = email
    ?.split("@")[0]
    ?.replace(/[._+-]/g, " ")
    .trim();
  if (local && local.length >= 2) {
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Ma société";
}

/** Crée une société SaaS + membership admin (Admin SDK — checkout en une requête). */
export async function provisionSaasCompanyAdmin(input: {
  db: Firestore;
  auth: typeof admin.auth;
  uid: string;
  email: string | null;
  planId?: SubscriptionPlanId | null;
  companyName?: string;
}): Promise<string> {
  const companyName = input.companyName?.trim() || deriveCompanyName(input.email);
  const companyRef = input.db.collection("companies").doc();

  const payload: Record<string, unknown> = {
    name: companyName,
    createdAt: FieldValue.serverTimestamp(),
    createdByUid: input.uid,
  };

  if (input.planId) {
    payload.saasSubscription = {
      planId: input.planId,
      status: "none",
    };
  }

  await companyRef.set(payload);
  await input.db.doc(`users/${input.uid}/company_memberships/${companyRef.id}`).set({
    companyId: companyRef.id,
    role: "admin",
    joinedAt: FieldValue.serverTimestamp(),
    companyName,
  });

  await syncTenantClaims(input.auth, input.db, input.uid, companyRef.id);
  return companyRef.id;
}
