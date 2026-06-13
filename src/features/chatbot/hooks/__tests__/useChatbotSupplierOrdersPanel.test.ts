import { renderHook, act } from "@testing-library/react";
import { useChatbotSupplierOrdersPanel } from "@/features/chatbot/hooks/useChatbotSupplierOrdersPanel";
import { fetchChatbotPwaRegistry } from "@/features/chatbot/fetchChatbotPwaRegistry";
import { subscribeSupplierOrders } from "@/features/suppliers/supplierFirestore";
import { onSnapshot } from "firebase/firestore";

jest.mock("@/features/chatbot/fetchChatbotPwaRegistry", () => ({
  fetchChatbotPwaRegistry: jest.fn(),
}));

jest.mock("@/features/suppliers/supplierFirestore", () => ({
  subscribeSupplierOrders: jest.fn(() => jest.fn()),
}));

const mockFetchChatbotPwaRegistry = fetchChatbotPwaRegistry as jest.MockedFunction<
  typeof fetchChatbotPwaRegistry
>;
const mockSubscribeSupplierOrders = subscribeSupplierOrders as jest.MockedFunction<
  typeof subscribeSupplierOrders
>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

describe("useChatbotSupplierOrdersPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSnapshot.mockReturnValue(jest.fn());
    mockFetchChatbotPwaRegistry.mockResolvedValue({
      ok: true,
      data: { supplierOrders: [], materialOrders: [] },
    } as never);
  });

  it("ne démarre pas pwa-registry ni Firestore tant que le panel est fermé", () => {
    renderHook(() => useChatbotSupplierOrdersPanel("co-test", "uid-test"));

    expect(mockFetchChatbotPwaRegistry).not.toHaveBeenCalled();
    expect(mockSubscribeSupplierOrders).not.toHaveBeenCalled();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("ne déclenche pas pwa-registry quand firebaseUid est 'anon' même panel ouvert", async () => {
    const { result } = renderHook(() => useChatbotSupplierOrdersPanel("co-test", "anon"));

    await act(() => {
      result.current.openSupplierOrdersPanel("order-123");
    });

    expect(mockFetchChatbotPwaRegistry).not.toHaveBeenCalled();
    expect(mockSubscribeSupplierOrders).not.toHaveBeenCalled();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it("ne déclenche pas pwa-registry quand firebaseUid est null", async () => {
    const { result } = renderHook(() => useChatbotSupplierOrdersPanel("co-test", null));

    await act(() => {
      result.current.openSupplierOrdersPanel("order-123");
    });

    expect(mockFetchChatbotPwaRegistry).not.toHaveBeenCalled();
    expect(mockSubscribeSupplierOrders).not.toHaveBeenCalled();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });
});
