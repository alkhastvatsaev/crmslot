"use client";

import { useCompanySaasSubscriptionFromContext } from "@/core/FeatureFlagsProvider";
import type { CompanySaasSubscription } from "@/features/subscriptions/subscriptionTypes";

export function useCompanySubscription(): {
  subscription: CompanySaasSubscription | null;
  loading: boolean;
} {
  const { subscription, loading } = useCompanySaasSubscriptionFromContext();
  return { subscription, loading };
}
