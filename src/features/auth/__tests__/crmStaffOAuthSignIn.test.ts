import { signInWithCredential, signInWithPopup, signInWithRedirect } from "firebase/auth";
import {
  CrmStaffOAuthRedirectPending,
  crmStaffOAuthSignInErrorFeedback,
  signInCrmStaffWithApple,
  signInCrmStaffWithGoogle,
} from "@/features/auth/crmStaffOAuthSignIn";
import {
  authorizeNativeAppleSignIn,
  NativeAppleSignInCancelled,
  shouldUseNativeAppleSignIn,
} from "@/core/native/nativeAppleSignIn";

jest.mock("@/core/native/nativeAppleSignIn", () => ({
  shouldUseNativeAppleSignIn: jest.fn(() => false),
  authorizeNativeAppleSignIn: jest.fn(),
  NativeAppleSignInCancelled: class NativeAppleSignInCancelled extends Error {
    override readonly name = "NativeAppleSignInCancelled";
  },
  firebaseAppleOAuthRedirectUri: jest.fn(
    () => "https://belgique-72708.firebaseapp.com/__/auth/handler"
  ),
}));

const mockAuth = {} as never;
const mockShouldUseNativeAppleSignIn = shouldUseNativeAppleSignIn as jest.MockedFunction<
  typeof shouldUseNativeAppleSignIn
>;
const mockAuthorizeNativeAppleSignIn = authorizeNativeAppleSignIn as jest.MockedFunction<
  typeof authorizeNativeAppleSignIn
>;

describe("signInCrmStaffWithGoogle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldUseNativeAppleSignIn.mockReturnValue(false);
  });

  it("uses popup by default", async () => {
    const cred = await signInCrmStaffWithGoogle(mockAuth);
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(cred.user.email).toBe("google@test.example");
  });

  it("falls back to redirect when popup is blocked", async () => {
    (signInWithPopup as jest.Mock).mockRejectedValueOnce({ code: "auth/popup-blocked" });
    await expect(signInCrmStaffWithGoogle(mockAuth)).rejects.toBeInstanceOf(
      CrmStaffOAuthRedirectPending
    );
    expect(signInWithRedirect).toHaveBeenCalledTimes(1);
  });
});

describe("signInCrmStaffWithApple", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockShouldUseNativeAppleSignIn.mockReturnValue(false);
  });

  it("uses popup on web by default", async () => {
    const cred = await signInCrmStaffWithApple(mockAuth);
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(cred.user.email).toBe("google@test.example");
  });

  it("uses native Apple sheet on Capacitor iOS", async () => {
    mockShouldUseNativeAppleSignIn.mockReturnValue(true);
    mockAuthorizeNativeAppleSignIn.mockResolvedValue({
      identityToken: "apple-id-token",
      rawNonce: "raw-nonce",
    });

    const cred = await signInCrmStaffWithApple(mockAuth);

    expect(mockAuthorizeNativeAppleSignIn).toHaveBeenCalledTimes(1);
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
    expect(signInWithPopup).not.toHaveBeenCalled();
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(cred.user.email).toBe("apple@test.example");
  });

  it("maps native cancel to popup-closed feedback", async () => {
    mockShouldUseNativeAppleSignIn.mockReturnValue(true);
    mockAuthorizeNativeAppleSignIn.mockRejectedValue(new NativeAppleSignInCancelled());

    await expect(signInCrmStaffWithApple(mockAuth)).rejects.toMatchObject({
      code: "auth/popup-closed-by-user",
    });
    expect(
      crmStaffOAuthSignInErrorFeedback("apple", { code: "auth/popup-closed-by-user" })
    ).toEqual({
      titleKey: "auth.apple_signin_cancelled",
    });
  });
});
