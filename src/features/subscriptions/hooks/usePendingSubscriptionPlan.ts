"use client";

import { useEffect, useState } from "react";
import { readPendingSubscriptionPlan } from "@/features/subscriptions/pendingSubscriptionPlan";
import type { SubscriptionPlanId } from "@/features/subscriptions/subscriptionTypes";

/** Plan choisi sur /pricing — réactif (sessionStorage). */
export function usePendingSubscriptionPlan(): SubscriptionPlanId | null {
  const [planId, setPlanId] = useState<SubscriptionPlanId | null>(null);

  useEffect(() => {
    const sync = () => setPlanId(readPendingSubscriptionPlan());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return planId;
}
