import { render, screen, fireEvent } from "@/test-utils/render";
import PayrollExportButton from "../PayrollExportButton";
import { downloadPayrollCsv } from "../../exportPayrollCsv";

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: () => true,
}));

jest.mock("@/core/config/firebase", () => ({
  auth: { currentUser: { uid: "tech-1" } },
}));

jest.mock("../../hooks/useTimeEntries", () => ({
  useTimeEntries: () => [
    {
      id: "e1",
      companyId: "co-1",
      technicianUid: "tech-1",
      interventionId: "iv-1",
      type: "on_site",
      startedAt: "2026-06-10T08:00:00.000Z",
      endedAt: "2026-06-10T09:00:00.000Z",
      durationMinutes: 60,
    },
  ],
  useCompanyTimeEntries: () => [
    {
      id: "e2",
      companyId: "co-1",
      technicianUid: "tech-2",
      interventionId: "iv-2",
      type: "travel",
      startedAt: "2026-06-10T10:00:00.000Z",
      endedAt: "2026-06-10T10:30:00.000Z",
      durationMinutes: 30,
    },
  ],
}));

jest.mock("../../exportPayrollCsv", () => ({
  downloadPayrollCsv: jest.fn(),
}));

describe("PayrollExportButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exporte les feuilles du technicien connecté", () => {
    render(<PayrollExportButton scope="technician" />);
    fireEvent.click(screen.getByTestId("payroll-export-button"));
    expect(downloadPayrollCsv).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ technicianUid: "tech-1" })])
    );
  });

  it("exporte toutes les feuilles de la société en mode company", () => {
    render(<PayrollExportButton scope="company" />);
    fireEvent.click(screen.getByTestId("payroll-export-button"));
    expect(downloadPayrollCsv).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ technicianUid: "tech-2" })])
    );
  });
});
