import { signInWithEmailAndPassword } from "firebase/auth";
import {
  signInTechnicianWithEmail,
  technicianEmailSignInErrorFeedback,
} from "@/features/auth/technicianEmailSignIn";

describe("technicianEmailSignIn", () => {
  it("calls signInWithEmailAndPassword with trimmed email", async () => {
    const auth = {} as never;
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({ user: { uid: "tech-1" } });

    await signInTechnicianWithEmail({
      auth,
      email: "  tech@example.com  ",
      password: "secret",
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, "tech@example.com", "secret");
  });

  it("maps invalid credential to auth.invalid_credentials", () => {
    expect(technicianEmailSignInErrorFeedback({ code: "auth/invalid-credential" }).titleKey).toBe(
      "auth.invalid_credentials"
    );
  });
});
