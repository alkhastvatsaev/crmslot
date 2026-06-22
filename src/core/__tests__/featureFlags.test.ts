import { DEFAULT_FEATURE_FLAGS, featureFlagsFromEnv, mergeFeatureFlags } from "@/core/featureFlags";

describe("featureFlags", () => {
  it("dispatchVoice est activé par défaut", () => {
    expect(DEFAULT_FEATURE_FLAGS.dispatchVoice).toBe(true);
    expect(featureFlagsFromEnv().dispatchVoice).toBe(true);
  });

  it("mergeFeatureFlags peut activer dispatchVoice via override Firestore", () => {
    const merged = mergeFeatureFlags(featureFlagsFromEnv(), { dispatchVoice: true });
    expect(merged.dispatchVoice).toBe(true);
  });
});
