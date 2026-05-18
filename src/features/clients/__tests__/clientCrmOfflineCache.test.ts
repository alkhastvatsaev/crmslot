import {
  readClientsOfflineCache,
  writeClientsOfflineCache,
} from "@/features/clients/clientCrmOfflineCache";

describe("clientCrmOfflineCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips clients for a company", () => {
    writeClientsOfflineCache("co-1", [
      {
        id: "cl-1",
        companyId: "co-1",
        displayName: "Test",
      },
    ]);
    expect(readClientsOfflineCache("co-1")).toHaveLength(1);
    expect(readClientsOfflineCache("co-2")).toHaveLength(0);
  });
});
