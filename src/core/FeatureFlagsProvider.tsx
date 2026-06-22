"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  DEFAULT_FEATURE_FLAGS,
  featureFlagsFromEnv,
  mergeFeatureFlags,
  type CrmslotFeatureFlags,
} from "@/core/featureFlags";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useDocumentPageVisible } from "@/core/perf/useDocumentPageVisible";
import {
  IOS_FIRESTORE_SLOW_POLL_MS,
  shouldUseIosFirestorePolling,
  startIosFirestorePoll,
} from "@/core/firestore/iosFirestorePolling";

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

    const applyRemote = (raw: unknown) => {
      if (!raw || typeof raw !== "object") {
        setRemote(null);
        return;
      }
      setRemote(raw as Partial<CrmslotFeatureFlags>);
    };

    if (shouldUseIosFirestorePolling()) {
      let cancelled = false;
      const pull = async () => {
        try {
          const snap = await getDoc(ref);
          if (cancelled) return;
          applyRemote(snap.data()?.featureFlags);
        } catch {
          if (!cancelled) setRemote(null);
        }
      };
      const stop = startIosFirestorePoll(
        () => void pull(),
        documentVisible,
        IOS_FIRESTORE_SLOW_POLL_MS
      );
      return () => {
        cancelled = true;
        stop();
      };
    }

    return onSnapshot(
      ref,
      (snap) => {
        applyRemote(snap.data()?.featureFlags);
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
