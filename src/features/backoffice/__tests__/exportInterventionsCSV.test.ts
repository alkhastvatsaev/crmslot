import { interventionsToCSV } from "@/features/backoffice/exportInterventionsCSV";
import type { Intervention } from "@/features/interventions/types";

function makeIv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue de la Loi 1",
    time: "10:00",
    status: "done",
    location: { lat: 50.8, lng: 4.35 },
    clientName: "Jean Dupont",
    ...partial,
  };
}

describe("exportInterventionsCSV", () => {
  it("generates valid CSV with headers", () => {
    const csv = interventionsToCSV([makeIv()]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("ID,Titre,Client");
    expect(lines[1]).toContain("iv-1");
    expect(lines[1]).toContain("Jean Dupont");
  });

  it("escapes commas and quotes in values", () => {
    const csv = interventionsToCSV([
      makeIv({ address: 'Rue "Grande", 5' }),
    ]);
    expect(csv).toContain('"Rue ""Grande"", 5"');
  });

  it("handles empty interventions array", () => {
    const csv = interventionsToCSV([]);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1); // headers only
  });

  it("formats invoice amount from cents to euros", () => {
    const csv = interventionsToCSV([makeIv({ invoiceAmountCents: 15000 })]);
    expect(csv).toContain("150.00");
  });

  it("resolves technician names from lookup", () => {
    const csv = interventionsToCSV(
      [makeIv({ assignedTechnicianUid: "tech-1" })],
      { "tech-1": "Mansour" },
    );
    expect(csv).toContain("Mansour");
  });
});
