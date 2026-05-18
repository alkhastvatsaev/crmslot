import { clientsToCsv } from "@/features/clients/exportClientsCsv";

describe("exportClientsCsv", () => {
  it("builds semicolon csv", () => {
    const csv = clientsToCsv([
      {
        id: "c1",
        companyId: "co",
        displayName: "Jean Dupont",
        firstName: "Jean",
        lastName: "Dupont",
      },
    ]);
    expect(csv).toContain("Jean Dupont");
    expect(csv.split("\n").length).toBeGreaterThan(1);
  });
});
