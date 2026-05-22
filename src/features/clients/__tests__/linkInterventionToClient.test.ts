import {
  buildInterventionClientPatch,
  linkInterventionToClient,
} from "@/features/clients/linkInterventionToClient";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  updateDoc: jest.fn(async () => undefined),
  doc: jest.fn((_db, col, id) => ({ col, id })),
}));

const { updateDoc } = jest.requireMock("firebase/firestore");

const BASE_CLIENT = {
  displayName: "",
  firstName: "Jean",
  lastName: "Dupont",
  companyName: null as string | null,
  phone: "0470000000",
  email: "jean@example.com",
} as const;

describe("buildInterventionClientPatch", () => {
  it("denormalizes client and site", () => {
    const patch = buildInterventionClientPatch({
      clientId: "cl-1",
      siteId: "st-1",
      client: {
        displayName: "",
        firstName: "Jean",
        lastName: "Dupont",
        companyName: null,
        phone: "+32",
        email: null,
      },
      site: { label: "Siège", address: "Rue Neuve 1", lat: 50.85, lng: 4.35 },
    });
    expect(patch.clientId).toBe("cl-1");
    expect(patch.siteId).toBe("st-1");
    expect(patch.clientName).toBe("Jean Dupont");
    expect(patch.address).toBe("Rue Neuve 1");
    expect(patch.location).toEqual({ lat: 50.85, lng: 4.35 });
  });

  it("trims whitespace from string fields", () => {
    const patch = buildInterventionClientPatch({
      clientId: "cl-1",
      client: { ...BASE_CLIENT, firstName: "  Jean  ", lastName: "  Dupont  " },
    });
    expect(patch.clientFirstName).toBe("Jean");
    expect(patch.clientLastName).toBe("Dupont");
  });

  it("does NOT add address/location when site is absent", () => {
    const patch = buildInterventionClientPatch({ clientId: "cl-1", client: BASE_CLIENT });
    expect(patch.address).toBeUndefined();
    expect(patch.location).toBeUndefined();
  });

  it("does NOT add location when lat is null", () => {
    const patch = buildInterventionClientPatch({
      clientId: "cl-1",
      client: BASE_CLIENT,
      site: { address: "Rue Test", label: "X", lat: null as unknown as number, lng: 4.4 },
    });
    expect(patch.location).toBeUndefined();
  });

  it("normalizes whitespace-only siteId to null", () => {
    const patch = buildInterventionClientPatch({ clientId: "cl-1", siteId: "  ", client: BASE_CLIENT });
    expect(patch.siteId).toBeNull();
  });

  it("sets siteId when provided", () => {
    const patch = buildInterventionClientPatch({ clientId: "cl-1", siteId: "site-99", client: BASE_CLIENT });
    expect(patch.siteId).toBe("site-99");
  });

  it("falls back to phone without trim when trim is empty", () => {
    const patch = buildInterventionClientPatch({
      clientId: "cl-1",
      client: { ...BASE_CLIENT, phone: "+32 470 00 00 00" },
    });
    expect(patch.clientPhone).toBe("+32 470 00 00 00");
  });
});

describe("linkInterventionToClient", () => {
  beforeEach(() => {
    updateDoc.mockClear();
  });

  it("calls updateDoc on the interventions collection", async () => {
    await linkInterventionToClient({} as never, "iv-9", {
      clientId: "cl-1",
      client: { displayName: "ACME", firstName: null, lastName: null, companyName: "ACME", phone: null, email: null },
    });
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ col: "interventions", id: "iv-9" }),
      expect.objectContaining({ clientId: "cl-1", clientName: "ACME" }),
    );
  });

  it("throws when interventionId is empty", async () => {
    await expect(linkInterventionToClient({} as never, "", {
      clientId: "cl-1",
      client: BASE_CLIENT,
    })).rejects.toThrow("interventionId required");
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it("throws when interventionId is only whitespace", async () => {
    await expect(linkInterventionToClient({} as never, "   ", {
      clientId: "cl-1",
      client: BASE_CLIENT,
    })).rejects.toThrow("interventionId required");
  });
});
