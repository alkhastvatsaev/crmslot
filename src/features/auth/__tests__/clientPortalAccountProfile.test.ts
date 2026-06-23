import { getDoc, setDoc } from "firebase/firestore";
import {
  emptyClientPortalAccountFields,
  loadClientPortalAccountFields,
  mergeRequesterProfileFromAccount,
  parseClientPortalAccountDoc,
  resolveClientPortalAccountFields,
  saveClientPortalAccountFields,
  validateClientPortalAccountFields,
} from "@/features/auth/clientPortalAccountProfile";
import type { RequesterProfile } from "@/features/interventions";

jest.mock("@/core/config/firebase", () => ({
  isConfigured: true,
  clientPortalFirestore: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({ path: "client_portal_profiles/uid-1" })),
  getDoc: jest.fn(async () => ({
    exists: () => true,
    data: () => ({
      firstName: "Alice",
      lastName: "Dupont",
      email: "alice@example.be",
      phone: "+32 470 00 00 00",
      address: "Rue de la Loi 1",
    }),
  })),
  serverTimestamp: jest.fn(() => ({ _serverTimestamp: true })),
  setDoc: jest.fn(async () => undefined),
}));

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;

const baseProfile: RequesterProfile = {
  type: "login",
  firstName: "",
  lastName: "",
  companyName: "",
  phone: "",
  email: "",
  usualAddress: "",
  accessCode: "",
};

describe("parseClientPortalAccountDoc", () => {
  it("reads only explicit stored fields and auth email", () => {
    expect(
      parseClientPortalAccountDoc(
        { displayName: "Bob Martin", phone: "0470000000" },
        "bob@example.be"
      )
    ).toEqual({
      firstName: "",
      lastName: "",
      email: "bob@example.be",
      phone: "0470000000",
      address: "",
    });
  });
});

describe("resolveClientPortalAccountFields", () => {
  it("returns blank fields for a new account except auth email", () => {
    expect(resolveClientPortalAccountFields(null, "client@example.be")).toEqual({
      firstName: "",
      lastName: "",
      email: "client@example.be",
      phone: "",
      address: "",
    });
  });

  it("does not pull data from hub draft fallbacks", () => {
    expect(
      resolveClientPortalAccountFields(emptyClientPortalAccountFields(), "client@example.be")
    ).toEqual({
      firstName: "",
      lastName: "",
      email: "client@example.be",
      phone: "",
      address: "",
    });
  });
});

describe("validateClientPortalAccountFields", () => {
  it("requires first name, last name and phone only", () => {
    expect(
      validateClientPortalAccountFields({
        firstName: "",
        lastName: "Dupont",
        email: "alice@example.be",
        phone: "",
        address: "",
      })
    ).toEqual(["firstName", "phone"]);

    expect(
      validateClientPortalAccountFields({
        firstName: "Alice",
        lastName: "Dupont",
        email: "alice@example.be",
        phone: "0470000000",
        address: "",
      })
    ).toEqual([]);
  });
});

describe("mergeRequesterProfileFromAccount", () => {
  it("updates requester profile fields from account data", () => {
    expect(
      mergeRequesterProfileFromAccount(baseProfile, {
        firstName: "Alice",
        lastName: "Dupont",
        email: "alice@example.be",
        phone: "+32 470 00 00 00",
        address: "Rue de la Loi 1",
      })
    ).toEqual({
      ...baseProfile,
      firstName: "Alice",
      lastName: "Dupont",
      email: "alice@example.be",
      phone: "+32 470 00 00 00",
      usualAddress: "Rue de la Loi 1",
    });
  });
});

describe("loadClientPortalAccountFields", () => {
  it("loads profile document", async () => {
    await expect(loadClientPortalAccountFields("uid-1", "alice@example.be")).resolves.toEqual({
      firstName: "Alice",
      lastName: "Dupont",
      email: "alice@example.be",
      phone: "+32 470 00 00 00",
      address: "Rue de la Loi 1",
    });
  });
});

describe("saveClientPortalAccountFields", () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
  });

  it("writes account fields to Firestore", async () => {
    await saveClientPortalAccountFields("uid-1", {
      firstName: "Alice",
      lastName: "Dupont",
      email: "alice@example.be",
      phone: "+32 470 00 00 00",
      address: "Rue de la Loi 1",
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: "uid-1",
        firstName: "Alice",
        lastName: "Dupont",
        displayName: "Alice Dupont",
        email: "alice@example.be",
        phone: "+32 470 00 00 00",
        address: "Rue de la Loi 1",
      }),
      { merge: true }
    );
  });
});

describe("loadClientPortalAccountFields missing doc", () => {
  it("returns null when profile does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false } as Awaited<ReturnType<typeof getDoc>>);
    await expect(loadClientPortalAccountFields("uid-2")).resolves.toBeNull();
  });
});
