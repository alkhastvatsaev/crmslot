"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  DEFAULT_FEATURE_FLAGS,
  featureFlagsFromEnv,
  mergeFeatureFlags,
  type CrmslotFeatureFlags,
} from "@/core/featureFlags";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { parseCompanySaasSubscription } from "@/features/subscriptions/subscriptionAccess";
import type { CompanySaasSubscription } from "@/features/subscriptions/subscriptionTypes";

const FeatureFlagsContext = createContext<CrmslotFeatureFlags | null>(null);

type CompanySaasSubscriptionState = {
  subscription: CompanySaasSubscription | null;
  loading: boolean;
};

const CompanySaasSubscriptionContext = createContext<CompanySaasSubscriptionState>({
  subscription: null,
  loading: false,
});

/** Un seul listener Firestore `companies/{id}` pour toute l’app. */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [remote, setRemote] = useState<Partial<CrmslotFeatureFlags> | null>(null);
  const [saasSubscriptionState, setSaasSubscriptionState] = useState<CompanySaasSubscriptionState>({
    subscription: null,
    loading: false,
  });

  useEffect(() => {
    const firebaseUid = workspace?.firebaseUid;
    if (!firestore || !isConfigured || !companyId || !firebaseUid) {
      setRemote(null);
      setSaasSubscriptionState({ subscription: null, loading: false });
      return () => {};
    }
    setSaasSubscriptionState({ subscription: null, loading: true });
    const ref = doc(firestore, "companies", companyId);
    return onSnapshot(
      ref,
      (snap) => {
        const data = snap.data();
        const raw = data?.featureFlags;
        if (!raw || typeof raw !== "object") {
          setRemote(null);
        } else {
          setRemote(raw as Partial<CrmslotFeatureFlags>);
        }
        setSaasSubscriptionState({
          subscription: parseCompanySaasSubscription(data?.saasSubscription),
          loading: false,
        });
      },
      () => {
        setRemote(null);
        setSaasSubscriptionState({ subscription: null, loading: false });
      }
    );
  }, [companyId, workspace?.firebaseUid]);

  const flags = useMemo(() => mergeFeatureFlags(featureFlagsFromEnv(), remote), [remote]);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      <CompanySaasSubscriptionContext.Provider value={saasSubscriptionState}>
        {children}
      </CompanySaasSubscriptionContext.Provider>
    </FeatureFlagsContext.Provider>
  );
}

export function useCompanySaasSubscriptionFromContext(): CompanySaasSubscriptionState {
  return useContext(CompanySaasSubscriptionContext);
}

export function useFeatureFlagsFromContext(): CrmslotFeatureFlags {
  const ctx = useContext(FeatureFlagsContext);
  return ctx ?? mergeFeatureFlags(featureFlagsFromEnv(), null);
}
