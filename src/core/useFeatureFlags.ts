"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  DEFAULT_FEATURE_FLAGS,
  featureFlagsFromEnv,
  mergeFeatureFlags,
  type CrmslotFeatureFlags,
} from "@/core/featureFlags";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useDevEnergyProbe } from "@/features/dev/useDevEnergyProbe";

export function useFeatureFlags(): CrmslotFeatureFlags {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [remote, setRemote] = useState<Partial<CrmslotFeatureFlags> | null>(null);
  const listening = Boolean(firestore && isConfigured && companyId && workspace?.firebaseUid);
  useDevEnergyProbe(
    "feature-flags-doc",
    "Firestore flags société",
    "firestore",
    listening,
    companyId || undefined
  );

  useEffect(() => {
    const firebaseUid = workspace?.firebaseUid;
    if (!firestore || !isConfigured || !companyId || !firebaseUid) {
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
  }, [companyId, workspace?.firebaseUid]);

  return useMemo(() => mergeFeatureFlags(featureFlagsFromEnv(), remote), [remote]);
}

export function useFeatureFlag<K extends keyof CrmslotFeatureFlags>(key: K): boolean {
  const flags = useFeatureFlags();
  return flags[key];
}
