"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  clearPendingSubscriptionPlan,
  markSubscriptionCheckoutCompleted,
  markSubscriptionPricingRedirectDone,
  readPendingSubscriptionPlan,
  readPlanIdFromSearchParams,
  savePendingSubscriptionPlan,
  wasSubscriptionCheckoutCompleted,
  wasSubscriptionPricingRedirectDone,
} from "@/features/subscriptions/pendingSubscriptionPlan";
import { isSubscriptionActive, useCompanySubscription } from "@/features/subscriptions";

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
    if (!workspace?.firebaseUid || subscriptionLoading) return;
    if (wasSubscriptionCheckoutCompleted()) return;

    const subscriptionParam =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("subscription")?.trim()
        : null;
    if (subscriptionParam === "success") return;

    const pendingPlan = readPendingSubscriptionPlan();
    if (!pendingPlan) return;

    if (isSubscriptionActive(subscription)) {
      clearPendingSubscriptionPlan();
      return;
    }

    if (typeof window === "undefined") return;
    if (window.location.pathname === "/pricing") return;
    if (wasSubscriptionPricingRedirectDone()) return;

    markSubscriptionPricingRedirectDone();
    window.location.href = `/pricing?plan=${pendingPlan}`;
  }, [workspace?.firebaseUid, subscription, subscriptionLoading]);

  return null;
}

/** Persiste le plan choisi et renvoie vers /pricing après connexion pour le checkout Stripe. */
export default function SubscriptionSignupEffects() {
  return (
    <Suspense fallback={null}>
      <SubscriptionSignupEffectsInner />
    </Suspense>
  );
}
