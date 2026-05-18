/**
 * Feature flags — env (`NEXT_PUBLIC_FF_*`) + overrides Firestore `companies/{id}/featureFlags`.
 */
export type BelgmapFeatureFlags = {
  unifiedFieldCockpit: boolean;
  crmContacts: boolean;
  lecotProductSearch: boolean;
  commissionsV2: boolean;
  interventionCommandPalette: boolean;
};

export const DEFAULT_FEATURE_FLAGS: BelgmapFeatureFlags = {
  unifiedFieldCockpit: true,
  crmContacts: false,
  lecotProductSearch: false,
  commissionsV2: true,
  interventionCommandPalette: true,
};

function readEnvBool(key: string, fallback: boolean): boolean {
  if (typeof process === "undefined") return fallback;
  const raw = process.env[key]?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

/** Flags from build-time env (Vercel / .env.local). */
export function featureFlagsFromEnv(): BelgmapFeatureFlags {
  return {
    unifiedFieldCockpit: readEnvBool(
      "NEXT_PUBLIC_FF_UNIFIED_FIELD_COCKPIT",
      DEFAULT_FEATURE_FLAGS.unifiedFieldCockpit,
    ),
    crmContacts: readEnvBool("NEXT_PUBLIC_FF_CRM_CONTACTS", DEFAULT_FEATURE_FLAGS.crmContacts),
    lecotProductSearch: readEnvBool(
      "NEXT_PUBLIC_FF_LECOT_PRODUCT_SEARCH",
      DEFAULT_FEATURE_FLAGS.lecotProductSearch,
    ),
    commissionsV2: readEnvBool(
      "NEXT_PUBLIC_FF_COMMISSIONS_V2",
      DEFAULT_FEATURE_FLAGS.commissionsV2,
    ),
    interventionCommandPalette: readEnvBool(
      "NEXT_PUBLIC_FF_INTERVENTION_COMMAND_PALETTE",
      DEFAULT_FEATURE_FLAGS.interventionCommandPalette,
    ),
  };
}

export function mergeFeatureFlags(
  base: BelgmapFeatureFlags,
  partial?: Partial<BelgmapFeatureFlags> | null,
): BelgmapFeatureFlags {
  if (!partial) return base;
  return { ...base, ...partial };
}
