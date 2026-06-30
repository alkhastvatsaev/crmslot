import {
  NativeAppleSignInCancelled,
  authorizeNativeAppleSignIn,
  firebaseAppleOAuthRedirectUri,
  shouldUseNativeAppleSignIn,
} from "@/core/native/nativeAppleSignIn";
import * as capacitorRuntime from "@/core/native/capacitorRuntime";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
  getCapacitorPlatform: jest.fn(),
}));

jest.mock("@/core/native/appleOAuthNonce", () => ({
  createAppleSignInNonce: jest.fn(() =>
    Promise.resolve({ rawNonce: "raw-nonce-1234567890", hashedNonce: "hashed-nonce" })
  ),
}));

const authorize = jest.fn();

jest.mock("@capacitor-community/apple-sign-in", () => ({
  SignInWithApple: {
    authorize: (...args: unknown[]) => authorize(...args),
  },
}));

describe("shouldUseNativeAppleSignIn", () => {
  beforeEach(() => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(false);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("web");
  });

  it("true uniquement sur iOS natif", () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("ios");
    expect(shouldUseNativeAppleSignIn()).toBe(true);
  });

  it("false sur Android natif", () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("android");
    expect(shouldUseNativeAppleSignIn()).toBe(false);
  });
});

describe("firebaseAppleOAuthRedirectUri", () => {
  const original = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = original;
  });

  it("construit l'URL handler Firebase", () => {
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "myproject.firebaseapp.com";
    expect(firebaseAppleOAuthRedirectUri()).toBe(
      "https://myproject.firebaseapp.com/__/auth/handler"
    );
  });

  it("échoue si le domaine Firebase est absent", () => {
    delete process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    expect(() => firebaseAppleOAuthRedirectUri()).toThrow(/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/);
  });
});

describe("authorizeNativeAppleSignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "myproject.firebaseapp.com";
  });

  it("retourne identityToken et rawNonce", async () => {
    authorize.mockResolvedValue({
      response: { identityToken: "  apple-jwt  " },
    });

    await expect(authorizeNativeAppleSignIn()).resolves.toEqual({
      identityToken: "apple-jwt",
      rawNonce: "raw-nonce-1234567890",
    });

    expect(authorize).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "com.crmslot.app",
        redirectURI: "https://myproject.firebaseapp.com/__/auth/handler",
        nonce: "hashed-nonce",
      })
    );
  });

  it("lève NativeAppleSignInCancelled si l'utilisateur annule", async () => {
    authorize.mockRejectedValue({ code: "1001" });

    await expect(authorizeNativeAppleSignIn()).rejects.toBeInstanceOf(NativeAppleSignInCancelled);
  });

  it("lève une erreur si le token est absent", async () => {
    authorize.mockResolvedValue({ response: { identityToken: "   " } });

    await expect(authorizeNativeAppleSignIn()).rejects.toThrow(
      "apple_signin_missing_identity_token"
    );
  });
});
