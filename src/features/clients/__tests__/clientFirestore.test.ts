import { createClient, CLIENTS_COLLECTION } from "@/features/clients/clientFirestore";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  addDoc: jest.fn(async () => ({ id: "client-1" })),
  collection: jest.fn((_db, name) => name),
  serverTimestamp: jest.fn(() => "ts"),
}));

const { addDoc } = jest.requireMock("firebase/firestore");

describe("clientFirestore", () => {
  beforeEach(() => {
    addDoc.mockClear();
  });

  it("createClient writes to clients collection", async () => {
    const id = await createClient({} as never, {
      companyId: "co-1",
      displayName: "Dupont SA",
    });
    expect(id).toBe("client-1");
    expect(addDoc).toHaveBeenCalledWith(
      CLIENTS_COLLECTION,
      expect.objectContaining({ companyId: "co-1", displayName: "Dupont SA" }),
    );
  });
});
