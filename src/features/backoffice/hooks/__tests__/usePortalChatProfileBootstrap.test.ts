import { renderHook, waitFor } from "@testing-library/react";
import { usePortalChatProfileBootstrap } from "@/features/backoffice/hooks/usePortalChatProfileBootstrap";

const mockRequestPortalChatProfileEnsure = jest.fn();

jest.mock("@/features/backoffice/requestPortalChatProfileEnsure", () => ({
  requestPortalChatProfileEnsure: (...args: unknown[]) =>
    mockRequestPortalChatProfileEnsure(...args),
}));

const user = { uid: "guest-1", isAnonymous: true } as import("firebase/auth").User;

describe("usePortalChatProfileBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestPortalChatProfileEnsure.mockResolvedValue(undefined);
  });

  it("is ready immediately for staff chat", () => {
    const { result } = renderHook(() => usePortalChatProfileBootstrap(false, "co-1", user, true));
    expect(result.current.ready).toBe(true);
    expect(mockRequestPortalChatProfileEnsure).not.toHaveBeenCalled();
  });

  it("calls ensure-profile API before enabling Firestore sync", async () => {
    const { result } = renderHook(() => usePortalChatProfileBootstrap(true, "co-1", user, true));

    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(mockRequestPortalChatProfileEnsure).toHaveBeenCalledWith(user, "co-1");
  });

  it("surfaces permission errors from API bootstrap", async () => {
    mockRequestPortalChatProfileEnsure.mockRejectedValue({ code: "permission-denied" });
    const { result } = renderHook(() => usePortalChatProfileBootstrap(true, "co-1", user, true));

    await waitFor(() => expect(result.current.errorKey).toBe("chat.profile_permission_denied"));
    expect(result.current.ready).toBe(false);
  });
});
