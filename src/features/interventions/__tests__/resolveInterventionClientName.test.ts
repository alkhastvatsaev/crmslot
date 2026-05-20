import {
  clientNameFirestorePatchIfMissing,
  resolveInterventionClientName,
} from "@/features/interventions/resolveInterventionClientName";

describe("resolveInterventionClientName", () => {
  it("uses first and last name when clientName empty", () => {
    expect(
      resolveInterventionClientName({
        clientFirstName: "Jean",
        clientLastName: "Dupont",
        clientName: null,
        title: "",
      }),
    ).toBe("Jean Dupont");
  });

  it("fills clientName patch when missing on record", () => {
    expect(
      clientNameFirestorePatchIfMissing({
        clientFirstName: "Marie",
        clientLastName: "Martin",
      }),
    ).toEqual({ clientName: "Marie Martin" });
  });
});
