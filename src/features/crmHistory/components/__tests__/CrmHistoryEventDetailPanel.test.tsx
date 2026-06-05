import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/test-utils/render";
import CrmHistoryEventDetailPanel from "../CrmHistoryEventDetailPanel";
import type { CrmActivityEvent } from "../../crmActivityTypes";

const event: CrmActivityEvent = {
  id: "e1",
  type: "intervention_created",
  ts: new Date("2024-06-01T10:00:00Z").getTime(),
  interventionId: "iv1",
  interventionTitle: "Serrure bloquée",
  clientName: "Dupont SA",
};

describe("CrmHistoryEventDetailPanel", () => {
  it("shows empty state when no event", () => {
    render(<CrmHistoryEventDetailPanel event={null} />);
    expect(screen.getByTestId("crm-history-detail-empty")).toBeInTheDocument();
  });

  it("shows detail text and open dossier action", () => {
    const onOpen = jest.fn();
    render(<CrmHistoryEventDetailPanel event={event} onOpenIntervention={onOpen} />);
    expect(screen.getByTestId("crm-history-detail-panel")).toBeInTheDocument();
    expect(screen.getByTestId("crm-history-detail-title")).toHaveTextContent(/Dossier créé|Case created/i);
    expect(screen.getByText(/Dupont SA/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("crm-history-detail-open-dossier"));
    expect(onOpen).toHaveBeenCalledWith(event);
  });
});
