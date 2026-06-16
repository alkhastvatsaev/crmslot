import * as admin from "firebase-admin";
import { verifyGmailRouteCompanyAccess } from "@/features/gmail/gmailRouteCompany";

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
  it("checks membership in firestore", async () => {
    await expect(verifyGmailRouteCompanyAccess("uid-1", "allowed-co")).resolves.toBe(true);
    await expect(verifyGmailRouteCompanyAccess("uid-1", "denied-co")).resolves.toBe(false);
  });

  it("rejects empty company id", async () => {
    await expect(verifyGmailRouteCompanyAccess("uid-1", "")).resolves.toBe(false);
  });
});
