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
import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";

const FeatureFlagsContext = createContext<CrmslotFeatureFlags | null>(null);

/** Un seul listener Firestore `companies/{id}` pour toute l’app. */
export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const documentVisible = useDocumentPageVisible();
  const [remote, setRemote] = useState<Partial<CrmslotFeatureFlags> | null>(null);

  useEffect(() => {
    const firebaseUid = workspace?.firebaseUid;
    if (!firestore || !isConfigured || !companyId || !firebaseUid || !documentVisible) {
      setRemote(null);
      return () => {};
    }
    const ref = doc(firestore, "companies", companyId);
    return onSnapshot(
      ref,
      (snap) => {
        const raw = snap.data()?.featureFlags;
        if (!raw || typeof raw !== "object") {
          setRemote(null);
          return;
        }
        setRemote(raw as Partial<CrmslotFeatureFlags>);
      },
      () => setRemote(null)
    );
  }, [companyId, workspace?.firebaseUid, documentVisible]);

  const flags = useMemo(() => mergeFeatureFlags(featureFlagsFromEnv(), remote), [remote]);

  return <FeatureFlagsContext.Provider value={flags}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlagsFromContext(): CrmslotFeatureFlags {
  const ctx = useContext(FeatureFlagsContext);
  return ctx ?? mergeFeatureFlags(featureFlagsFromEnv(), null);
}
