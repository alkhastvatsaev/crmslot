"use client";

import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { firestore } from "@/core/config/firebase";
import { readPendingSubscriptionPlan } from "@/features/subscriptions/pendingSubscriptionPlan";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

function deriveCompanyName(user: User): string {
  const local = user.email
    ?.split("@")[0]
    ?.replace(/[._+-]/g, " ")
    .trim();
  if (local && local.length >= 2) {
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Ma société";
}

/** Crée une société dédiée pour un nouvel abonné SaaS (≠ société démo par défaut). */
export async function provisionSaasCompanyForAdmin(
  user: User,
  options?: { companyName?: string; pendingPlanId?: SubscriptionPlanId | null }
): Promise<string> {
  if (!firestore) {
    throw new Error("Firestore indisponible.");
  }

  const companyName = options?.companyName?.trim() || deriveCompanyName(user);
  const pendingPlanId = options?.pendingPlanId ?? readPendingSubscriptionPlan();

  const companyPayload: Record<string, unknown> = {
    name: companyName,
    createdAt: serverTimestamp(),
    createdByUid: user.uid,
  };

  if (pendingPlanId) {
    companyPayload.saasSubscription = {
      planId: pendingPlanId,
      status: "none",
    };
  }

  const cref = await addDoc(collection(firestore, "companies"), companyPayload);
  await setDoc(doc(firestore, "users", user.uid, "company_memberships", cref.id), {
    companyId: cref.id,
    role: "admin",
    joinedAt: serverTimestamp(),
    companyName,
  });

  await user.getIdToken(true);
  return cref.id;
}

export function isSaasSignupFlow(): boolean {
  return typeof window !== "undefined" && readPendingSubscriptionPlan() !== null;
}
