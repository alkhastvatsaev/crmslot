import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import BillingHubCenterPanel from "@/features/billingHub/components/BillingHubCenterPanel";
import { BillingHubIntentProvider } from "@/context/BillingHubIntentContext";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> & Pick<Intervention, "id">): Intervention {
  return {
    title: "Test",
    address: "Rue test",
    time: "10:00",
    status: "done",
    location: { lat: 50.8, lng: 4.35 },
    ...partial,
  };
}

function renderPanel(interventions: Intervention[]) {
  return render(
    <BillingHubIntentProvider>
      <BillingHubCenterPanel
        interventions={interventions}
        isPreviewCatalog={false}
        loading={false}
      />
    </BillingHubIntentProvider>
  );
}

describe("BillingHubCenterPanel", () => {
  it("renders a 3x3 grid of empty slots when there are no dossiers", () => {
    renderPanel([]);
    expect(screen.getByTestId("billing-hub-empty-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId(/billing-hub-empty-slot-/)).toHaveLength(9);
  });

  it("renders square tiles and pads up to nine slots", () => {
    renderPanel([
      iv({
        id: "bill-a",
        clientName: "Dupont",
        paymentStatus: "unpaid",
        billingLines: [{ description: "Main d'œuvre", quantity: 1, unitPriceCents: 12_000 }],
      }),
    ]);

    expect(screen.getByTestId("billing-hub-grid")).toBeInTheDocument();
    expect(screen.getByTestId("billing-hub-row-bill-a")).toBeInTheDocument();
    expect(screen.getAllByTestId(/billing-hub-empty-slot-/)).toHaveLength(8);
  });
});
