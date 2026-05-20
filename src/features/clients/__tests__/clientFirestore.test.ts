import {
  CLIENTS_COLLECTION,
  createClient,
  deleteClientWithSites,
  SITES_COLLECTION,
} from "@/features/clients/clientFirestore";

const batchDelete = jest.fn();
const batchCommit = jest.fn(async () => undefined);

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  addDoc: jest.fn(async () => ({ id: "client-1" })),
  collection: jest.fn((_db, name) => name),
  doc: jest.fn((_db, collectionName, id) => ({ collectionName, id })),
  getDocs: jest.fn(async () => ({
    docs: [{ ref: { path: "sites/site-1" } }],
  })),
  query: jest.fn((...args: unknown[]) => args),
  serverTimestamp: jest.fn(() => "ts"),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  writeBatch: jest.fn(() => ({
    delete: batchDelete,
    commit: batchCommit,
  })),
}));

const { addDoc, getDocs, writeBatch } = jest.requireMock("firebase/firestore");

describe("clientFirestore", () => {
  beforeEach(() => {
    addDoc.mockClear();
    batchDelete.mockClear();
    batchCommit.mockClear();
    getDocs.mockClear();
    writeBatch.mockClear();
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

  it("deleteClientWithSites removes sites then client in one batch", async () => {
    await deleteClientWithSites({} as never, "co-1", "client-1");
    expect(getDocs).toHaveBeenCalled();
    expect(writeBatch).toHaveBeenCalled();
    expect(batchDelete).toHaveBeenCalledTimes(2);
    expect(batchCommit).toHaveBeenCalled();
    expect(batchDelete).toHaveBeenCalledWith(
      expect.objectContaining({ collectionName: CLIENTS_COLLECTION, id: "client-1" }),
    );
    expect(batchDelete).toHaveBeenCalledWith(expect.objectContaining({ path: "sites/site-1" }));
    expect(SITES_COLLECTION).toBe("sites");
  });
});
