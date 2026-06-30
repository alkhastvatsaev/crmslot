import React from "react";
import { act, renderHook } from "@testing-library/react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import { sendSignInLinkToEmail } from "firebase/auth";
import { toast } from "sonner";
import { useClientPortalAuthSignIn } from "@/features/auth/hooks/useClientPortalAuthSignIn";
import { syncClientPortalProfile } from "@/features/auth/clientPortalProfile";
import {
  signInClientPortalWithGoogle,
  ClientPortalGoogleRedirectPending,
} from "@/features/auth/clientPortalGoogleSignIn";
import {
  registerClientPortalAccount,
  signInClientPortalWithVerifiedEmail,
} from "@/features/auth/clientPortalEmailVerification";
import { CLIENT_PORTAL_AUTH_SLOT_INDEX } from "@/features/auth/clientPortalConstants";

jest.mock("@/features/auth/clientPortalProfile", () => ({
  syncClientPortalProfile: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/features/auth/clientPortalGoogleSignIn", () => ({
  ...jest.requireActual("@/features/auth/clientPortalGoogleSignIn"),
  signInClientPortalWithGoogle: jest.fn(),
}));

jest.mock("@/features/auth/clientPortalEmailVerification", () => ({
  registerClientPortalAccount: jest.fn(),
  signInClientPortalWithVerifiedEmail: jest.fn(),
}));

jest.mock("@/features/dashboard", () => ({
  useDashboardPagerOptional: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    message: jest.fn(),
  },
}));

import { useDashboardPagerOptional } from "@/features/dashboard";

const pagerSetPage = jest.fn();
const syncProfileMock = syncClientPortalProfile as jest.MockedFunction<
  typeof syncClientPortalProfile
>;
const googleSignInMock = signInClientPortalWithGoogle as jest.MockedFunction<
  typeof signInClientPortalWithGoogle
>;
const registerMock = registerClientPortalAccount as jest.MockedFunction<
  typeof registerClientPortalAccount
>;
const signInEmailMock = signInClientPortalWithVerifiedEmail as jest.MockedFunction<
  typeof signInClientPortalWithVerifiedEmail
>;
const sendLinkMock = sendSignInLinkToEmail as jest.MockedFunction<typeof sendSignInLinkToEmail>;
const pagerMock = useDashboardPagerOptional as jest.MockedFunction<
  typeof useDashboardPagerOptional
>;

const portalUser = { uid: "client-1", email: "client@test.com" } as import("firebase/auth").User;

function renderSignIn(overrides: Partial<Parameters<typeof useClientPortalAuthSignIn>[0]> = {}) {
  const setPassword = jest.fn();
  const setConfirmPassword = jest.fn();
  const args = {
    authRailMode: false,
    authTab: "login" as const,
    email: "client@test.com",
    password: "secret123",
    confirmPassword: "secret123",
    setPassword,
    setConfirmPassword,
    user: null,
    ...overrides,
  };
  const hook = renderHook(() => useClientPortalAuthSignIn(args), { wrapper: hookWrapper });
  return { ...hook, setPassword, setConfirmPassword };
}

function hookWrapper({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

describe("useClientPortalAuthSignIn", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pagerMock.mockReturnValue({ setPageIndex: pagerSetPage } as unknown as ReturnType<
      typeof useDashboardPagerOptional
    >);
    googleSignInMock.mockResolvedValue({ user: portalUser } as never);
    signInEmailMock.mockResolvedValue({ user: portalUser } as never);
    registerMock.mockResolvedValue(undefined as never);
    sendLinkMock.mockResolvedValue(undefined as never);
  });

  it("handleEmailPasswordSubmit exige un email", async () => {
    const { result } = renderSignIn({ email: "  " });

    await act(async () => {
      await result.current.handleEmailPasswordSubmit();
    });

    expect(toast.error).toHaveBeenCalled();
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it("handleEmailPasswordSubmit refuse un mismatch en register", async () => {
    const { result } = renderSignIn({
      authTab: "register",
      password: "aaa",
      confirmPassword: "bbb",
    });

    await act(async () => {
      await result.current.handleEmailPasswordSubmit();
    });

    expect(toast.error).toHaveBeenCalled();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("connexion email réussie synchronise le profil et ouvre le hub société", async () => {
    const { result, setPassword, setConfirmPassword } = renderSignIn();

    await act(async () => {
      await result.current.handleEmailPasswordSubmit();
    });

    expect(signInEmailMock).toHaveBeenCalled();
    expect(syncProfileMock).toHaveBeenCalledWith(portalUser);
    expect(pagerSetPage).toHaveBeenCalledWith(CLIENT_PORTAL_AUTH_SLOT_INDEX);
    expect(setPassword).toHaveBeenCalledWith("");
    expect(setConfirmPassword).toHaveBeenCalledWith("");
    expect(toast.success).toHaveBeenCalled();
  });

  it("handleGoogleSignIn gère la redirection OAuth en cours", async () => {
    googleSignInMock.mockRejectedValue(new ClientPortalGoogleRedirectPending());
    const { result } = renderSignIn();

    await act(async () => {
      await result.current.handleGoogleSignIn();
    });

    expect(toast.message).toHaveBeenCalled();
    expect(syncProfileMock).not.toHaveBeenCalled();
  });

  it("sendMagicLink persiste l'email et notifie l'utilisateur", async () => {
    const { result } = renderSignIn();
    window.localStorage.clear();

    await act(async () => {
      await result.current.sendMagicLink();
    });

    expect(sendLinkMock).toHaveBeenCalled();
    expect(window.localStorage.getItem("bm_client_portal_email_link")).toBe("client@test.com");
    expect(toast.success).toHaveBeenCalled();
  });

  it("goDashboard ne fait rien sans utilisateur connecté", async () => {
    const { result } = renderSignIn({ user: null });

    await act(async () => {
      await result.current.goDashboard();
    });

    expect(syncProfileMock).not.toHaveBeenCalled();
    expect(pagerSetPage).not.toHaveBeenCalled();
  });
});
