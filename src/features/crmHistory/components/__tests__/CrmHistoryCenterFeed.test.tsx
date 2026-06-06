import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/test-utils/render";
import CrmHistoryCenterFeed from "../CrmHistoryCenterFeed";
import type { CrmActivityEvent } from "../../crmActivityTypes";

const BASE_TS = new Date("2024-06-01T10:00:00Z").getTime();

const makeEvent = (overrides: Partial<CrmActivityEvent> = {}): CrmActivityEvent => ({
  id: "e1",
  type: "intervention_created",
  ts: BASE_TS,
  interventionId: "iv1",
  interventionTitle: "Serrure bloquée",
  clientName: "Dupont SA",
  ...overrides,
});

describe("CrmHistoryCenterFeed", () => {
  it("shows loading indicator when loading", () => {
    render(<CrmHistoryCenterFeed events={[]} loading={true} />);
    expect(screen.getByTestId("crm-center-loading")).toBeInTheDocument();
  });

  it("does not show feed when loading", () => {
    render(<CrmHistoryCenterFeed events={[makeEvent()]} loading={true} />);
    expect(screen.queryByTestId("crm-center-feed")).not.toBeInTheDocument();
  });

  it("shows empty state when no events and not loading", () => {
    render(<CrmHistoryCenterFeed events={[]} loading={false} />);
    expect(screen.getByTestId("crm-center-empty")).toBeInTheDocument();
  });

  it("renders the feed container when events exist", () => {
    render(<CrmHistoryCenterFeed events={[makeEvent()]} loading={false} />);
    expect(screen.getByTestId("crm-center-feed")).toBeInTheDocument();
  });

  it("renders an event row with correct testid", () => {
    render(<CrmHistoryCenterFeed events={[makeEvent()]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });

  it("renders multiple events across different dates", () => {
    const e1 = makeEvent({ id: "e1", ts: new Date("2024-06-01T08:00:00Z").getTime() });
    const e2 = makeEvent({ id: "e2", ts: new Date("2024-06-02T08:00:00Z").getTime() });
    render(<CrmHistoryCenterFeed events={[e2, e1]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
    expect(screen.getByTestId("crm-event-e2")).toBeInTheDocument();
  });

  it("calls onEventSelect when clicking an event row", () => {
    const event = makeEvent({ interventionId: "iv1" });
    const onEventSelect = jest.fn();
    render(<CrmHistoryCenterFeed events={[event]} loading={false} onEventSelect={onEventSelect} />);
    fireEvent.click(screen.getByTestId("crm-event-e1"));
    expect(onEventSelect).toHaveBeenCalledTimes(1);
    expect(onEventSelect).toHaveBeenCalledWith(event);
  });

  it("highlights selected event row", () => {
    const event = makeEvent();
    render(
      <CrmHistoryCenterFeed
        events={[event]}
        loading={false}
        selectedEventId="e1"
        onEventSelect={jest.fn()}
      />
    );
    expect(screen.getByTestId("crm-event-e1")).toHaveClass("ring-2");
  });

  it("does not crash when clicking without select handler", () => {
    const event = makeEvent({ interventionId: "iv1" });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    fireEvent.click(screen.getByTestId("crm-event-e1"));
  });

  it("renders intervention_status event card", () => {
    const event = makeEvent({
      type: "intervention_status",
      statusBefore: "en_route",
      statusAfter: "in_progress",
    });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });

  it("renders supplier_ordered event card", () => {
    const event = makeEvent({
      type: "supplier_ordered",
      orderTotalCents: 9900,
      interventionId: undefined,
    });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });

  it("renders commission_calculated event card", () => {
    const event = makeEvent({
      type: "commission_calculated",
      commissionAmountEuros: 45.5,
      commissionAction: "calculated",
    });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });

  it("renders commission_calculated event card without action", () => {
    const event = makeEvent({ type: "commission_calculated", commissionAmountEuros: 20 });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });

  it("renders email_sent event card", () => {
    const event = makeEvent({
      type: "email_sent",
      emailFrom: "team@belg.be",
      emailTo: "client@example.com",
      emailSubject: "Devis",
    });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });

  it("renders email_received event card", () => {
    const event = makeEvent({
      type: "email_received",
      emailFrom: "client@example.com",
      emailTo: "team@belg.be",
      emailSubject: "Re: Devis",
    });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });

  it("renders quote_created event", () => {
    const event = makeEvent({ type: "quote_created" });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByText(/Devis créé|Quote created/i)).toBeInTheDocument();
  });

  it("renders quote_status_changed event card", () => {
    const event = makeEvent({
      type: "quote_status_changed",
      statusBefore: "draft",
      statusAfter: "sent",
    });
    render(<CrmHistoryCenterFeed events={[event]} loading={false} />);
    expect(screen.getByText(/Statut devis modifié|Quote status updated/i)).toBeInTheDocument();
    expect(screen.getByTestId("crm-event-e1")).toBeInTheDocument();
  });
});
