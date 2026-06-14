import { fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { render } from "@/test-utils/render";
import RequesterPortalAccessUnlock from "../RequesterPortalAccessUnlock";

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const setPortalAccessSession = jest.fn();

jest.mock("@/features/interventions/context/RequesterHubContext", () => ({
  useRequesterHub: () => ({
    setPortalAccessSession,
  }),
}));

describe("RequesterPortalAccessUnlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(async () =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          emailNormalized: "client@example.com",
          interventions: [{ id: "iv-1", status: "pending", title: "Porte" }],
        }),
      })
    ) as jest.Mock;
  });

  it("déverrouille le portail avec le numéro de dossier", async () => {
    render(<RequesterPortalAccessUnlock />);

    expect(screen.queryByTestId("tracking-portal-access-email")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("tracking-portal-access-code"), {
      target: { value: "abcd1234" },
    });
    fireEvent.click(screen.getByTestId("tracking-portal-access-submit"));

    await waitFor(() => {
      expect(setPortalAccessSession).toHaveBeenCalledWith(
        expect.objectContaining({
          emailNormalized: "client@example.com",
          interventionIds: ["iv-1"],
        })
      );
    });
    expect(toast.success).toHaveBeenCalled();
  });
});
