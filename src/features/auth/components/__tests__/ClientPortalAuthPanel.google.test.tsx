import { fireEvent, waitFor } from "@testing-library/react";
import { signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { render, screen } from "@/test-utils/render";
import ClientPortalAuthPanel from "@/features/auth/components/ClientPortalAuthPanel";
import { syncClientPortalProfile } from "@/features/auth/clientPortalProfile";

jest.mock("@/features/auth/clientPortalProfile", () => ({
  syncClientPortalProfile: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/features/gmail/components/GmailGoogleConnectButton", () => ({
  __esModule: true,
  default: ({
    onClick,
    disabled,
    dataTestId,
  }: {
    onClick: () => void;
    disabled?: boolean;
    dataTestId?: string;
  }) => (
    <button type="button" data-testid={dataTestId} disabled={disabled} onClick={onClick}>
      Google
    </button>
  ),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    message: jest.fn(),
  },
}));

const mockSync = syncClientPortalProfile as jest.MockedFunction<typeof syncClientPortalProfile>;

describe("ClientPortalAuthPanel Google sign-in", () => {
  beforeEach(() => {
    mockSync.mockClear();
    (toast.success as jest.Mock).mockClear();
  });

  it("renders Google button in auth rail login section", () => {
    render(<ClientPortalAuthPanel authRailMode />);
    expect(screen.getByTestId("client-portal-google-signin")).toBeInTheDocument();
    expect(screen.getByText(/ou/i)).toBeInTheDocument();
  });

  it("syncs profile after Google popup sign-in", async () => {
    render(<ClientPortalAuthPanel authRailMode />);
    fireEvent.click(screen.getByTestId("client-portal-google-signin"));
    await waitFor(() => expect(signInWithPopup).toHaveBeenCalled());
    await waitFor(() => expect(mockSync).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
  });
});
