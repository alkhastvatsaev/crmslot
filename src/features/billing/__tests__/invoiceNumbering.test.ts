import {
  formatInvoiceNumber,
  invoiceCounterDocId,
  isValidInvoiceNumber,
} from "../invoiceNumbering";

describe("formatInvoiceNumber", () => {
  it("formate FAC-YYYY-NNNNN", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("FAC-2026-00001");
    expect(formatInvoiceNumber(2026, 42)).toBe("FAC-2026-00042");
    expect(formatInvoiceNumber(2026, 123456)).toBe("FAC-2026-123456");
  });

  it("plancher à 1", () => {
    expect(formatInvoiceNumber(2026, 0)).toBe("FAC-2026-00001");
    expect(formatInvoiceNumber(2026, -5)).toBe("FAC-2026-00001");
  });
});

describe("invoiceCounterDocId", () => {
  it("un compteur par année", () => {
    expect(invoiceCounterDocId(2026)).toBe("invoice-2026");
  });
});

describe("isValidInvoiceNumber", () => {
  it("accepte les numéros attribués", () => {
    expect(isValidInvoiceNumber("FAC-2026-00042")).toBe(true);
    expect(isValidInvoiceNumber("FAC-2026-123456")).toBe(true);
  });

  it("rejette les valeurs invalides", () => {
    expect(isValidInvoiceNumber(null)).toBe(false);
    expect(isValidInvoiceNumber(undefined)).toBe(false);
    expect(isValidInvoiceNumber("")).toBe(false);
    expect(isValidInvoiceNumber("iv-abc123")).toBe(false);
    expect(isValidInvoiceNumber("FAC-26-001")).toBe(false);
  });
});
