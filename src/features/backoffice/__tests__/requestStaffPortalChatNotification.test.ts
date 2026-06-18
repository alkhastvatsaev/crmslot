import { requestStaffPortalChatNotification } from "@/features/backoffice/requestStaffPortalChatNotification";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const fetchWithAuthMock = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

describe("requestStaffPortalChatNotification", () => {
  beforeEach(() => {
    fetchWithAuthMock.mockReset();
  });

  it("POST notify-staff with trimmed preview", async () => {
    fetchWithAuthMock.mockResolvedValue({ ok: true } as Response);

    await requestStaffPortalChatNotification({
      companyId: " co-1 ",
      interventionId: "iv-9",
      preview: "Bonjour",
      clientLabel: "Alice",
    });

    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/portal-chat/notify-staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: "co-1",
        interventionId: "iv-9",
        preview: "Bonjour",
        clientLabel: "Alice",
      }),
    });
  });

  it("skips when companyId empty", async () => {
    await requestStaffPortalChatNotification({ companyId: "  ", preview: "x" });
    expect(fetchWithAuthMock).not.toHaveBeenCalled();
  });
});
