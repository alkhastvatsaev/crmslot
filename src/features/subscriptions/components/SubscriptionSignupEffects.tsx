"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  clearAutoCheckoutAttempted,
  clearPendingSubscriptionPlan,
  markAutoCheckoutAttempted,
  markSubscriptionCheckoutCompleted,
  readPendingSubscriptionPlan,
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
  wasAutoCheckoutAttempted,
  wasSubscriptionCheckoutCompleted,
} from "@/features/subscriptions/pendingSubscriptionPlan";
import {
  isSubscriptionActive,
  startSubscriptionCheckout,
  subscriptionCheckoutEnabled,
  subscriptionEnforcementEnabled,
  useCompanySubscription,
} from "@/features/subscriptions";

function SubscriptionSignupEffectsInner() {
  const searchParams = useSearchParams();
  const workspace = useCompanyWorkspaceOptional();
  const { subscription, loading: subscriptionLoading } = useCompanySubscription();

  useEffect(() => {
    const subscriptionParam = searchParams.get("subscription")?.trim();
    if (subscriptionParam === "success") {
      markSubscriptionCheckoutCompleted();
      return;
    }

    const planId = readPlanIdFromSearchParams(searchParams);
    if (planId) {
      savePendingSubscriptionPlan(planId);
    }

    const authTab = searchParams.get("auth")?.trim();
    const plan = searchParams.get("plan")?.trim();
    const account = searchParams.get("account")?.trim();
    const setup = searchParams.get("setup")?.trim();
    if (authTab || plan || account || setup) {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      url.searchParams.delete("plan");
      url.searchParams.delete("account");
      url.searchParams.delete("setup");
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(window.history.state, "", next);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!subscriptionEnforcementEnabled() || !subscriptionCheckoutEnabled()) return;
    if (!workspace?.firebaseUid || !workspace.workspaceReady || subscriptionLoading) return;
    if (wasSubscriptionCheckoutCompleted()) return;

    const subscriptionParam = searchParams.get("subscription")?.trim();
    if (subscriptionParam === "success") return;

    if (isSubscriptionActive(subscription)) {
      clearPendingSubscriptionPlan();
      clearAutoCheckoutAttempted();
      return;
    }

    const pendingPlan = readPendingSubscriptionPlan();
    if (!pendingPlan || wasAutoCheckoutAttempted()) return;

    markAutoCheckoutAttempted();
    void startSubscriptionCheckout(pendingPlan)
      .then((url) => {
        window.location.assign(url);
      })
      .catch(() => {
        clearAutoCheckoutAttempted();
      });
  }, [
    workspace?.firebaseUid,
    workspace?.workspaceReady,
    subscription,
    subscriptionLoading,
    searchParams,
  ]);

  return null;
}

/** Inscription → checkout Stripe auto (sans passer par /pricing). */
export default function SubscriptionSignupEffects() {
  return (
    <Suspense fallback={null}>
      <SubscriptionSignupEffectsInner />
    </Suspense>
  );
}
