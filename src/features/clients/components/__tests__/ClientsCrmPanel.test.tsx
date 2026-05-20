import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ClientsCrmPanel from "@/features/clients/components/ClientsCrmPanel";

const flagState = { crmContacts: true };

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => (key === "crmContacts" ? flagState.crmContacts : false),
}));

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({ activeCompanyId: "co-test" }),
}));

jest.mock("@/features/clients/useClients", () => ({
  useClients: () => ({
    clients: [
      {
        id: "cl-1",
        companyId: "co-test",
        displayName: "Dupont SA",
        firstName: null,
        lastName: null,
        companyName: "Dupont SA",
        phone: null,
        email: null,
      },
    ],
    loading: false,
    offline: false,
  }),
}));

jest.mock("@/features/clients/useClientSites", () => ({
  useClientSites: () => ({ sites: [], loading: false }),
}));

jest.mock("@/features/clients/clientFirestore", () => ({
  createClient: jest.fn().mockResolvedValue("cl-new"),
  createSite: jest.fn().mockResolvedValue("st-new"),
  deleteClientWithSites: jest.fn().mockResolvedValue(undefined),
  updateClient: jest.fn().mockResolvedValue(undefined),
  bulkCreateClients: jest.fn().mockResolvedValue(0),
}));

describe("ClientsCrmPanel", () => {
  beforeEach(() => {
    flagState.crmContacts = true;
  });

  it("renders client list when CRM flag is on", () => {
    render(<ClientsCrmPanel />);
    expect(screen.getByTestId("clients-crm-panel")).toBeInTheDocument();
    expect(screen.getByTestId("crm-client-row-cl-1")).toHaveTextContent("Dupont SA");
  });

  it("shows disabled hint when flag is off", () => {
    flagState.crmContacts = false;
    render(<ClientsCrmPanel />);
    expect(screen.getByTestId("crm-disabled-hint")).toBeInTheDocument();
  });

  it("shows delete control when a client is selected", () => {
    render(<ClientsCrmPanel />);
    fireEvent.click(screen.getByTestId("crm-client-row-cl-1"));
    expect(screen.getByTestId("crm-delete-client-btn")).toBeInTheDocument();
  });
});
