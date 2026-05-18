import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import ClientInterventionsPanel from "@/features/clients/components/ClientInterventionsPanel";

jest.mock("@/features/clients/useClientInterventions", () => ({
  useClientInterventions: () => ({
    interventions: [
      {
        id: "iv-99",
        title: "Serrure",
        address: "Liège",
        time: "09:00",
        status: "done",
        location: { lat: 50.6, lng: 5.5 },
        companyId: "co-1",
        clientId: "cl-1",
        createdAt: "2026-05-10T08:00:00.000Z",
      },
    ],
    loading: false,
  }),
}));

describe("ClientInterventionsPanel", () => {
  it("lists interventions for client", () => {
    render(<ClientInterventionsPanel companyId="co-1" clientId="cl-1" />);
    expect(screen.getByTestId("client-interventions-panel")).toBeInTheDocument();
    expect(screen.getByTestId("client-intervention-row-iv-99")).toHaveTextContent("Serrure");
  });
});
