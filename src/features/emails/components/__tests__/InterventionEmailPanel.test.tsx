import { fireEvent, screen } from "@testing-library/react";
import { render } from "@/test-utils/render";

jest.mock("@/features/emails/interventionEmailFirestore", () => ({
  markEmailRead: jest.fn().mockResolvedValue(undefined),
}));

import InterventionEmailPanel from "@/features/emails/components/InterventionEmailPanel";
import { useInterventionEmails } from "@/features/emails/useInterventionEmails";

jest.mock("@/features/emails/useInterventionEmails");

const mockUseEmails = useInterventionEmails as jest.MockedFunction<typeof useInterventionEmails>;

describe("InterventionEmailPanel", () => {
  beforeEach(() => {
    mockUseEmails.mockReturnValue({ emails: [], loading: false, unreadCount: 0 });
  });

  it("renders panel title and opens compose", () => {
    render(<InterventionEmailPanel interventionId="iv-email-1" companyId="co-1" />);

    expect(screen.getByTestId("intervention-email-panel")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("email-panel-toggle"));
    fireEvent.click(screen.getByTestId("email-compose-open"));

    expect(screen.getByTestId("email-compose-form")).toBeInTheDocument();
    expect(screen.getByTestId("email-compose-to")).toBeInTheDocument();
  });

  it("auto-expands when unread inbound emails exist", () => {
    mockUseEmails.mockReturnValue({
      emails: [
        {
          id: "e1",
          interventionId: "iv-email-1",
          companyId: "co-1",
          direction: "inbound",
          from: "client@example.com",
          to: "support+iv@example.com",
          subject: "Urgent",
          bodyText: "Besoin aide",
          messageId: "<e1@example.com>",
          createdAt: "2026-05-17T09:00:00.000Z",
        },
      ],
      loading: false,
      unreadCount: 1,
    });

    render(<InterventionEmailPanel interventionId="iv-email-1" companyId="co-1" />);

    expect(screen.getByTestId("email-unread-badge")).toHaveTextContent("1");
    expect(screen.getByTestId("email-thread-list")).toBeInTheDocument();
  });
});
