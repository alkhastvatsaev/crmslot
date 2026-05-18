import { render, screen, fireEvent } from "@/test-utils/render";
import ChatDayClientsPicker from "@/features/backoffice/components/ChatDayClientsPicker";

describe("ChatDayClientsPicker", () => {
  it("opens client conversation on row click", () => {
    const onSelectClient = jest.fn();
    render(
      <ChatDayClientsPicker
        rows={[
          {
            threadId: "202605180",
            clientName: "M. Dubois",
            time: "10:00",
            statusLabel: "À venir",
          },
        ]}
        onSelectGlobal={jest.fn()}
        onSelectClient={onSelectClient}
      />,
    );
    fireEvent.click(screen.getByTestId("chat-day-client-row-202605180"));
    expect(onSelectClient).toHaveBeenCalledWith("202605180");
  });

  it("shows empty state", () => {
    render(
      <ChatDayClientsPicker rows={[]} onSelectGlobal={jest.fn()} onSelectClient={jest.fn()} />,
    );
    expect(screen.getByTestId("chat-day-clients-empty")).toBeInTheDocument();
  });
});
