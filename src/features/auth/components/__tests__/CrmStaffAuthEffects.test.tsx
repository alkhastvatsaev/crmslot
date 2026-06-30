import { waitFor } from "@testing-library/react";
import { getRedirectResult } from "firebase/auth";
import { render } from "@/test-utils/render";
import CrmStaffAuthEffects from "@/features/auth/components/CrmStaffAuthEffects";
import { shouldSkipCrmStaffOAuthRedirectHandling } from "@/features/gmail/gmailHubOAuthReturn";

jest.mock("firebase/auth", () => ({
  getRedirectResult: jest.fn(),
}));

jest.mock("@/core/config/firebase", () => ({
  auth: {},
  isConfigured: true,
}));

jest.mock("@/features/auth/crmEmailRegister", () => ({
  completeCrmStaffOAuthSession: jest.fn(),
  CrmStaffOAuthModeError: class CrmStaffOAuthModeError extends Error {},
  CrmStaffJoinCompanyError: class CrmStaffJoinCompanyError extends Error {},
}));

jest.mock("@/features/gmail/gmailHubOAuthReturn", () => ({
  ...jest.requireActual("@/features/gmail/gmailHubOAuthReturn"),
  shouldSkipCrmStaffOAuthRedirectHandling: jest.fn(() => false),
}));

const getRedirectResultMock = getRedirectResult as jest.MockedFunction<typeof getRedirectResult>;
const shouldSkipMock = shouldSkipCrmStaffOAuthRedirectHandling as jest.MockedFunction<
  typeof shouldSkipCrmStaffOAuthRedirectHandling
>;

describe("CrmStaffAuthEffects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    getRedirectResultMock.mockResolvedValue(null);
    shouldSkipMock.mockReturnValue(false);
  });

  // Régression : OAuth Gmail ne doit pas déclencher getRedirectResult CRM — 2026-06-30
  it("ne finalise pas le redirect CRM quand le flux Gmail est actif", async () => {
    shouldSkipMock.mockReturnValue(true);
    render(<CrmStaffAuthEffects />);

    await waitFor(() => {
      expect(getRedirectResultMock).not.toHaveBeenCalled();
    });
  });

  it("tente getRedirectResult hors flux Gmail", async () => {
    render(<CrmStaffAuthEffects />);

    await waitFor(() => {
      expect(getRedirectResultMock).toHaveBeenCalled();
    });
  });
});
