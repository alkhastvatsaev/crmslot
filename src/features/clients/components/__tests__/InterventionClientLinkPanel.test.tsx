import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import InterventionClientLinkPanel from "@/features/clients/components/InterventionClientLinkPanel";
import type { Intervention } from "@/features/interventions/types";
import { linkInterventionToClient } from "@/features/clients/linkInterventionToClient";

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => key === "crmContacts",
}));

jest.mock("@/features/clients/useClients", () => ({
  useClients: () => ({
    clients: [
      {
        id: "cl-1",
        companyId: "co-1",
        displayName: "Martin",
        firstName: "Paul",
        lastName: "Martin",
        companyName: null,
        phone: null,
        email: null,
      },
    ],
    loading: false,
  }),
}));

jest.mock("@/features/clients/useClientSites", () => ({
  useClientSites: () => ({
    sites: [{ id: "st-1", companyId: "co-1", clientId: "cl-1", label: "Bureau", address: "Bruxelles" }],
    loading: false,
  }),
}));

jest.mock("@/features/clients/linkInterventionToClient", () => ({
  linkInterventionToClient: jest.fn().mockResolvedValue(undefined),
}));

const baseIv: Intervention = {
  id: "iv-1",
  title: "Test",
  address: "Liège",
  time: "10:00",
  status: "pending",
  location: { lat: 50.6, lng: 5.5 },
  companyId: "co-1",
};

describe("InterventionClientLinkPanel", () => {
  beforeEach(() => {
    jest.mocked(linkInterventionToClient).mockClear();
  });

  it("links intervention to selected client", async () => {
    render(<InterventionClientLinkPanel intervention={baseIv} />);
    fireEvent.click(screen.getByTestId("intervention-crm-client-cl-1"));
    fireEvent.click(screen.getByTestId("intervention-crm-link-submit"));
    await waitFor(() => {
      expect(linkInterventionToClient).toHaveBeenCalledWith(
        expect.anything(),
        "iv-1",
        expect.objectContaining({ clientId: "cl-1" }),
      );
    });
  });
});
