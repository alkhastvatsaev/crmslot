import { renderHook, waitFor } from "@testing-library/react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useChatbotOrderImages } from "@/features/chatbot/hooks/useChatbotOrderImages";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

describe("useChatbotOrderImages", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetchWithAuth.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves image from local overlay without API", async () => {
    const { result } = renderHook(() =>
      useChatbotOrderImages([
        {
          orderId: "mo-1",
          reference: "GACH-ELEC",
          description: "Gâche électrique",
        },
      ])
    );

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current["mo-1"]).toMatch(/^https:\/\/lecot\.be\//);
    });
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });
});
