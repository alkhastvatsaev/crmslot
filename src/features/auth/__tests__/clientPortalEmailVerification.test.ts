import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  ClientPortalEmailNotVerifiedError,
  registerClientPortalAccount,
  signInClientPortalWithVerifiedEmail,
} from "@/features/auth/clientPortalEmailVerification";

const auth = {} as never;

describe("clientPortalEmailVerification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("envoie la vérification e-mail puis déconnecte après inscription", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: "new-user", email: "new@test.example", emailVerified: false },
    });

    const result = await registerClientPortalAccount({
      auth,
      email: "new@test.example",
      password: "secret123",
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      "new@test.example",
      "secret123"
    );
    expect(sendEmailVerification).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledWith(auth);
    expect(result.email).toBe("new@test.example");
  });

  it("refuse la connexion si l'e-mail n'est pas vérifié", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: "pwd-user", email: "pwd@test.example", emailVerified: false },
    });

    await expect(
      signInClientPortalWithVerifiedEmail({
        auth,
        email: "pwd@test.example",
        password: "secret123",
      })
    ).rejects.toBeInstanceOf(ClientPortalEmailNotVerifiedError);

    expect(sendEmailVerification).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledWith(auth);
  });

  it("autorise la connexion si l'e-mail est vérifié", async () => {
    const cred = {
      user: { uid: "pwd-user", email: "pwd@test.example", emailVerified: true },
    };
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce(cred);

    await expect(
      signInClientPortalWithVerifiedEmail({
        auth,
        email: "pwd@test.example",
        password: "secret123",
      })
    ).resolves.toBe(cred);

    expect(sendEmailVerification).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
});
