import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import EquipmentPanel from "@/features/equipment/components/EquipmentPanel";
import type { ClientEquipment } from "@/features/equipment/types";

const flagState = { equipmentInventory: true };

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) =>
    key === "equipmentInventory" ? flagState.equipmentInventory : false,
}));

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({ activeCompanyId: "co-test" }),
}));

const items: ClientEquipment[] = [
  {
    id: "eq-1",
    companyId: "co-test",
    clientId: "cl-1",
    siteId: null,
    label: "Chaudière Vaillant",
    brand: "Vaillant",
    model: "EcoTec",
    serialNumber: "SN-42",
    installDate: "2024-01-15",
    nextServiceDate: "2099-01-15",
    lastServiceDate: null,
    status: "active",
    notes: null,
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-01-15T00:00:00.000Z",
  },
];

jest.mock("@/features/equipment/equipmentFirestore", () => ({
  subscribeEquipmentByClient: jest.fn(
    (
      _db: unknown,
      _companyId: string,
      _clientId: string,
      onData: (i: ClientEquipment[]) => void
    ) => {
      onData(items);
      return () => {};
    }
  ),
  createEquipment: jest.fn().mockResolvedValue("eq-new"),
  retireEquipment: jest.fn().mockResolvedValue(undefined),
}));

describe("EquipmentPanel", () => {
  beforeEach(() => {
    flagState.equipmentInventory = true;
  });

  it("renders nothing when equipmentInventory flag is off", () => {
    flagState.equipmentInventory = false;
    render(<EquipmentPanel clientId="cl-1" />);
    expect(screen.queryByTestId("equipment-panel")).not.toBeInTheDocument();
  });

  it("renders equipment list when flag is on", () => {
    render(<EquipmentPanel clientId="cl-1" />);
    expect(screen.getByTestId("equipment-panel")).toBeInTheDocument();
    expect(screen.getByText("Chaudière Vaillant")).toBeInTheDocument();
    expect(screen.getByText(/Vaillant — EcoTec/)).toBeInTheDocument();
  });
});
