import { createAppleSignInNonce, sha256Hex } from "@/core/native/appleOAuthNonce";

describe("appleOAuthNonce", () => {
  it("sha256Hex is deterministic", async () => {
    await expect(sha256Hex("hello")).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });

  it("createAppleSignInNonce returns distinct raw and hashed values", async () => {
    const first = await createAppleSignInNonce();
    const second = await createAppleSignInNonce();
    expect(first.rawNonce).not.toBe(second.rawNonce);
    expect(first.hashedNonce).not.toBe(first.rawNonce);
    expect(first.hashedNonce).toHaveLength(64);
  });
});
