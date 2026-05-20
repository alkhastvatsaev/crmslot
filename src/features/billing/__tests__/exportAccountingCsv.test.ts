import { interventionsToAccountingRows, accountingRowsToCsv } from "../exportAccountingCsv";
import type { Intervention } from "@/features/interventions/types";

const makeIntervention = (overrides: Partial<Intervention> = {}): Intervention =>
  ({
    id: "iv1",
    companyId: "c1",
    status: "done",
    address: "Rue de la Loi 1, Bruxelles",
    clientName: "Dupont SA",
    paymentStatus: "paid",
    billingLines: [
      { description: "Serrure", quantity: 1, unitPriceCents: 8000 },
      { description: "Main d'oeuvre", quantity: 2, unitPriceCents: 5000 },
    ],
    ...overrides,
  }) as unknown as Intervention;

describe("interventionsToAccountingRows", () => {
  it("computes HT, TVA 6%, TTC", () => {
    const [row] = interventionsToAccountingRows([makeIntervention()]);
    expect(row.subtotalHtCents).toBe(18000); // 80 + 2*50
    expect(row.tvaCents).toBe(1080); // 18000 * 0.06
    expect(row.totalTtcCents).toBe(19080);
    expect(row.tvaRate).toBe(6);
  });

  it("skips interventions without billing lines", () => {
    const rows = interventionsToAccountingRows([makeIntervention({ billingLines: [] })]);
    expect(rows).toHaveLength(0);
  });

  it("includes clientName and paymentStatus", () => {
    const [row] = interventionsToAccountingRows([makeIntervention()]);
    expect(row.clientName).toBe("Dupont SA");
    expect(row.paymentStatus).toBe("paid");
  });
});

describe("accountingRowsToCsv", () => {
  it("has a header row", () => {
    const csv = accountingRowsToCsv([]);
    expect(csv).toContain("Date");
    expect(csv).toContain("TTC");
    expect(csv).toContain("TVA");
  });

  it("escapes double quotes in cell values", () => {
    const rows = interventionsToAccountingRows([makeIntervention({ clientName: 'Say "hello"' })]);
    const csv = accountingRowsToCsv(rows);
    expect(csv).toContain('""hello""');
  });

  it("produces correct line count (header + data)", () => {
    const rows = interventionsToAccountingRows([makeIntervention(), makeIntervention({ id: "iv2" })]);
    const lines = accountingRowsToCsv(rows).split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows
  });
});
