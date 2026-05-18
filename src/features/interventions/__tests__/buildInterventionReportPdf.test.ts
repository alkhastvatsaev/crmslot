import { buildInterventionReportPdf } from "../buildInterventionReportPdf";
import type { Intervention } from "../types";

// jsPDF is mocked globally via jest.setup.ts / module mock
jest.mock("jspdf", () => {
  const addImage = jest.fn();
  const addText = jest.fn();
  const mockDoc = {
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    setDrawColor: jest.fn(),
    text: addText,
    line: jest.fn(),
    addImage,
    splitTextToSize: jest.fn((text: string) => [text]),
    output: jest.fn(() => new ArrayBuffer(8)),
    lastAutoTable: { finalY: 80 },
  };
  return { jsPDF: jest.fn(() => mockDoc) };
});

jest.mock("jspdf-autotable", () => jest.fn());

const baseIntervention: Intervention = {
  id: "int-001",
  title: "Serrurerie urgente",
  address: "Rue de la Loi 1, 1000 Bruxelles",
  time: "09:00",
  status: "done",
  location: { lat: 50.85, lng: 4.35 },
  clientName: "Jean Dupont",
  createdAt: "2026-01-15T08:00:00.000Z",
  completedAt: "2026-01-15T10:30:00.000Z",
  actualDurationMinutes: 90,
  billingLines: [
    { description: "Cylindre européen", quantity: 1, unitPriceCents: 8500 },
    { description: "Main-d'œuvre", quantity: 2, unitPriceCents: 4500 },
  ],
};

describe("buildInterventionReportPdf", () => {
  it("returns a Uint8Array", () => {
    const result = buildInterventionReportPdf(baseIntervention);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("handles missing billing lines gracefully", () => {
    const iv = { ...baseIntervention, billingLines: undefined };
    expect(() => buildInterventionReportPdf(iv)).not.toThrow();
  });

  it("handles missing client name gracefully", () => {
    const iv = { ...baseIntervention, clientName: null };
    expect(() => buildInterventionReportPdf(iv)).not.toThrow();
  });

  it("handles signature URL", () => {
    const iv = { ...baseIntervention, completionSignatureUrl: "data:image/png;base64,abc" };
    expect(() => buildInterventionReportPdf(iv)).not.toThrow();
  });
});
