import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import {
  CrmStaffOAuthRedirectPending,
  signInCrmStaffWithApple,
  signInCrmStaffWithGoogle,
} from "@/features/auth/crmStaffOAuthSignIn";

const mockAuth = {} as never;

describe("signInCrmStaffWithGoogle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it("uses popup by default", async () => {
    const cred = await signInCrmStaffWithApple(mockAuth);
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(cred.user.email).toBe("google@test.example");
  });
});
