import { renderHook, waitFor } from "@testing-library/react";
import { usePortalChatProfileBootstrap } from "@/features/backoffice/hooks/usePortalChatProfileBootstrap";

jest.mock("@/features/backoffice/ensurePortalChatProfile", () => ({
  ensurePortalChatProfile: jest.fn(),
}));

const { ensurePortalChatProfile } = jest.requireMock(
  "@/features/backoffice/ensurePortalChatProfile"
) as { ensurePortalChatProfile: jest.Mock };

const user = { uid: "guest-1", isAnonymous: true } as import("firebase/auth").User;
const chatAuth = { currentUser: user } as import("firebase/auth").Auth;
const chatDb = {} as import("firebase/firestore").Firestore;

describe("usePortalChatProfileBootstrap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ensurePortalChatProfile.mockResolvedValue(undefined);
  });

  it("is ready immediately for staff chat", () => {
    const { result } = renderHook(() =>
      usePortalChatProfileBootstrap(false, chatDb, chatAuth, "co-1", user, true)
    );
    expect(result.current.ready).toBe(true);
    expect(ensurePortalChatProfile).not.toHaveBeenCalled();
  });

  it("creates portal profile before enabling Firestore sync", async () => {
    const { result } = renderHook(() =>
      usePortalChatProfileBootstrap(true, chatDb, chatAuth, "co-1", user, true)
    );

    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(ensurePortalChatProfile).toHaveBeenCalledWith(chatDb, user, "co-1");
  });

  it("surfaces permission errors from profile bootstrap", async () => {
    ensurePortalChatProfile.mockRejectedValue({ code: "permission-denied" });
    const { result } = renderHook(() =>
      usePortalChatProfileBootstrap(true, chatDb, chatAuth, "co-1", user, true)
    );

    await waitFor(() => expect(result.current.errorKey).toBe("chat.profile_permission_denied"));
    expect(result.current.ready).toBe(false);
  });
});
