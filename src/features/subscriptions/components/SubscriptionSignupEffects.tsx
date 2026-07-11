"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDashboardPageSelectorOptional } from "@/features/dashboard/DashboardPageSelectorContext";
import {
  readPendingSubscriptionPlan,
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
} from "@/features/subscriptions/pendingSubscriptionPlan";

function SubscriptionSignupEffectsInner() {
  const searchParams = useSearchParams();
  const pageSelector = useDashboardPageSelectorOptional();

  useEffect(() => {
    const planId = readPlanIdFromSearchParams(searchParams);
    if (planId) {
      savePendingSubscriptionPlan(planId);
    }

    const shouldOpenAccount =
      searchParams.get("account") === "1" || Boolean(planId ?? readPendingSubscriptionPlan());

    if (shouldOpenAccount) {
      pageSelector?.openAccount();
    }

    const authTab = searchParams.get("auth")?.trim();
    const plan = searchParams.get("plan")?.trim();
    const account = searchParams.get("account")?.trim();
    if (!authTab && !plan && !account) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("plan");
    url.searchParams.delete("account");
    url.searchParams.delete("setup");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", next);
  }, [searchParams, pageSelector]);

  return null;
}

/** Persiste le plan choisi et ouvre Mon compte après connexion/inscription. */
export default function SubscriptionSignupEffects() {
  return (
    <Suspense fallback={null}>
      <SubscriptionSignupEffectsInner />
    </Suspense>
  );
}
