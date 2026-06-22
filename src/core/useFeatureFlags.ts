"use client";

import { useFeatureFlagsFromContext } from "@/core/FeatureFlagsProvider";
import type { CrmslotFeatureFlags } from "@/core/featureFlags";

export function useFeatureFlags(): CrmslotFeatureFlags {
  return useFeatureFlagsFromContext();
}

export function useFeatureFlag<K extends keyof CrmslotFeatureFlags>(key: K): boolean {
  const flags = useFeatureFlags();
  return flags[key];
}
