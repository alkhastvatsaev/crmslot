import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import {
  ClientPortalGoogleRedirectPending,
  signInClientPortalWithGoogle,
} from "@/features/auth/clientPortalGoogleSignIn";

const mockAuth = { app: { name: "test" } } as never;

describe("signInClientPortalWithGoogle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses popup when available", async () => {
    const cred = await signInClientPortalWithGoogle(mockAuth);
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(cred.user.email).toBe("google@test.example");
  });

  it("falls back to redirect when popup is blocked", async () => {
    (signInWithPopup as jest.Mock).mockRejectedValueOnce({ code: "auth/popup-blocked" });
    await expect(signInClientPortalWithGoogle(mockAuth)).rejects.toBeInstanceOf(
      ClientPortalGoogleRedirectPending,
    );
    expect(signInWithRedirect).toHaveBeenCalledTimes(1);
  });
});
