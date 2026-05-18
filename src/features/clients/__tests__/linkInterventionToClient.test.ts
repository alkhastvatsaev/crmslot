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

describe("linkInterventionToClient", () => {
  beforeEach(() => {
    updateDoc.mockClear();
  });

  it("buildInterventionClientPatch denormalizes client and site", () => {
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

  it("linkInterventionToClient updates interventions doc", async () => {
    await linkInterventionToClient({} as never, "iv-9", {
      clientId: "cl-1",
      client: { displayName: "ACME", firstName: null, lastName: null, companyName: "ACME", phone: null, email: null },
    });
    expect(updateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ col: "interventions", id: "iv-9" }),
      expect.objectContaining({ clientId: "cl-1", clientName: "ACME" }),
    );
  });
});
