import * as admin from "firebase-admin";
import {
  isLocalDevelopmentRuntime,
  LOCAL_DEV_GMAIL_UID,
} from "@/core/api/routeAuth";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { verifyGmailRouteCompanyAccess } from "@/features/gmail/gmailRouteCompany";

jest.mock("@/core/api/routeAuth", () => ({
  isLocalDevelopmentRuntime: jest.fn(),
  LOCAL_DEV_GMAIL_UID: "local-dev-gmail",
}));

jest.mock("firebase-admin", () => ({
  apps: [{ name: "test" }],
  firestore: jest.fn(() => ({
    doc: jest.fn((path: string) => ({
      get: jest.fn().mockResolvedValue({
        exists: path.includes("allowed-co"),
      }),
    })),
  })),
}));

describe("verifyGmailRouteCompanyAccess", () => {
  beforeEach(() => {
    (isLocalDevelopmentRuntime as jest.Mock).mockReturnValue(false);
  });

  it("allows local dev uid on demo company", async () => {
    (isLocalDevelopmentRuntime as jest.Mock).mockReturnValue(true);
    await expect(
      verifyGmailRouteCompanyAccess(LOCAL_DEV_GMAIL_UID, DEMO_COMPANY_ID),
    ).resolves.toBe(true);
  });

  it("checks membership in firestore", async () => {
    await expect(verifyGmailRouteCompanyAccess("uid-1", "allowed-co")).resolves.toBe(true);
    await expect(verifyGmailRouteCompanyAccess("uid-1", "denied-co")).resolves.toBe(false);
  });

  it("rejects empty company id", async () => {
    await expect(verifyGmailRouteCompanyAccess("uid-1", "")).resolves.toBe(false);
  });
});
