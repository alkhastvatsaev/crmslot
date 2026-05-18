import { featureFlagsFromEnv, mergeFeatureFlags, DEFAULT_FEATURE_FLAGS } from "@/core/featureFlags";

describe("featureFlags", () => {
  it("merges remote overrides", () => {
    const merged = mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, { crmContacts: true });
    expect(merged.crmContacts).toBe(true);
    expect(merged.unifiedFieldCockpit).toBe(true);
  });

  it("reads env defaults when unset", () => {
    const flags = featureFlagsFromEnv();
    expect(typeof flags.interventionCommandPalette).toBe("boolean");
  });
});
