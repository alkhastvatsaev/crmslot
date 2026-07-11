"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { parseCompanySaasSubscription } from "@/features/subscriptions/subscriptionAccess";
import type { CompanySaasSubscription } from "@/features/subscriptions/subscriptionTypes";

export function useCompanySubscription(): {
  subscription: CompanySaasSubscription | null;
  loading: boolean;
} {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [subscription, setSubscription] = useState<CompanySaasSubscription | null>(null);
  const [loading, setLoading] = useState(Boolean(companyId));

  useEffect(() => {
    if (!firestore || !companyId) {
      setSubscription(null);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    const ref = doc(firestore, "companies", companyId);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const parsed = parseCompanySaasSubscription(snap.data()?.saasSubscription);
        setSubscription(parsed);
        setLoading(false);
      },
      () => {
        setSubscription(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [companyId]);

  return { subscription, loading };
}
