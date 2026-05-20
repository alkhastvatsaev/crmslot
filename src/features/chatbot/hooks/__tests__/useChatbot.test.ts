import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { I18nProvider } from "@/core/i18n/I18nContext";
import { useChatbot } from "@/features/chatbot/hooks/useChatbot";
import { buildChatbotTestSnapshot } from "@/features/chatbot/testFixtures/chatbotWorkspaceSnapshot";
import type { ChatbotConversation, ChatbotStreamEvent } from "@/features/chatbot/chatbot-types";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;
const mockOpenDocumentPreview = jest.fn();
const mockEnsureRightPanelOpen = jest.fn();
const mockOpenSupplierOrdersPanel = jest.fn();
const mockRefreshRegistry = jest.fn();

const STORAGE_KEY = "belmap-chatbot-v2:uid-test:co-test";
const snapshot = buildChatbotTestSnapshot();

const mockWorkspace = {
  activeCompanyId: "co-test" as string | null,
  activeRole: "admin" as const,
  firebaseUid: "uid-test",
  isTenantUser: false,
  memberships: [{ companyId: "co-test", companyName: "Test SA" }],
};

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => mockWorkspace,
}));

jest.mock("@/features/copilot/hooks/useWorkspaceCopilotSnapshot", () => ({
  useWorkspaceCopilotSnapshot: () => ({
    loading: false,
    snapshot,
  }),
}));

jest.mock("@/features/chatbot/hooks/useChatbotDocumentPreview", () => ({
  useChatbotDocumentPreview: () => ({
    documentPreview: {
      interventionId: "",
      kind: "invoice",
      title: "",
      blobUrl: null,
      loading: false,
      error: null,
    },
    openDocumentPreview: (...args: unknown[]) => mockOpenDocumentPreview(...args),
    openSupplierOrderPdf: jest.fn(),
    setDocumentKind: jest.fn(),
    refreshDocumentPreview: jest.fn(),
    closeDocumentPreview: jest.fn(),
  }),
}));

jest.mock("@/features/chatbot/hooks/useChatbotSupplierOrdersPanel", () => ({
  useChatbotSupplierOrdersPanel: () => ({
    supplierOrdersPanel: { open: true, highlightOrderId: null, highlightMaterialOrderId: null },
    supplierOrders: [],
    materialOrders: [],
    registryError: null,
    refreshRegistry: mockRefreshRegistry,
    openSupplierOrdersPanel: (...args: unknown[]) => mockOpenSupplierOrdersPanel(...args),
    closeSupplierOrdersPanel: jest.fn(),
    ensureRightPanelOpen: mockEnsureRightPanelOpen,
  }),
}));

jest.mock("@/features/chatbot/hooks/useChatbotInvoicesPanel", () => ({
  useChatbotInvoicesPanel: () => ({
    invoices: [],
    loading: false,
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return createElement(I18nProvider, null, children);
}

/** Mock SSE body compatible with `readChatbotStream` (jsdom has no global `Response`). */
function streamResponse(events: ChatbotStreamEvent[]): Response {
  const payload = `${events.map((e) => JSON.stringify(e)).join("\n")}\n`;
  const bytes = Uint8Array.from(Buffer.from(payload, "utf-8"));
  let consumed = false;
  const body = {
    getReader: () => ({
      read: async () => {
        if (consumed) return { done: true as const, value: undefined };
        consumed = true;
        return { done: false as const, value: bytes };
      },
      releaseLock: () => {},
    }),
  };
  return {
    ok: true,
    status: 200,
    body,
    text: async () => payload,
  } as unknown as Response;
}

describe("useChatbot", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockFetchWithAuth.mockReset();
    mockWorkspace.activeCompanyId = "co-test";
    let n = 0;
    jest.spyOn(crypto, "randomUUID").mockImplementation(() => `uuid-${++n}`);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("restores conversations from localStorage", async () => {
    const stored: ChatbotConversation[] = [
      {
        id: "conv-saved",
        title: "Sauvegardée",
        createdAt: 1,
        updatedAt: 1,
        messages: [{ id: "m1", role: "user", content: "Bonjour", createdAt: 1 }],
        apiMessages: [],
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useChatbot(), { wrapper });

    await waitFor(() => {
      expect(result.current.conversations).toHaveLength(1);
    });
    expect(result.current.activeId).toBe("conv-saved");
    expect(result.current.activeConversation?.title).toBe("Sauvegardée");
  });

  it("newConversation persists to localStorage", async () => {
    const { result } = renderHook(() => useChatbot(), { wrapper });

    await waitFor(() => {
      expect(result.current.companyId).toBe("co-test");
    });

    act(() => {
      result.current.newConversation();
    });

    await waitFor(() => {
      expect(result.current.conversations.length).toBeGreaterThan(0);
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as ChatbotConversation[];
    expect(parsed[0]?.title).toBe("Nouvelle conversation");
  });

  it("sendMessage sets error when no company is selected", async () => {
    mockWorkspace.activeCompanyId = null;
    const { result } = renderHook(() => useChatbot(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("bonjour");
    });

    expect(result.current.error).toMatch(/société active/i);
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });

  it("sendMessage calls /api/ai/chatbot for salutation (OpenAI)", async () => {
    mockFetchWithAuth.mockResolvedValue(
      streamResponse([
        { type: "text", delta: "Bonjour !" },
        { type: "done", apiMessages: [{ role: "assistant", content: "Bonjour !" }] },
      ]),
    );

    const { result } = renderHook(() => useChatbot(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("Hey");
    });

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        "/api/ai/chatbot",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });


  it("opens document preview on document_preview stream event", async () => {
    mockFetchWithAuth.mockResolvedValue(
      streamResponse([
        {
          type: "document_preview",
          interventionId: "iv-fourche",
          documentType: "invoice",
        },
        { type: "done", apiMessages: [] },
      ]),
    );

    const { result } = renderHook(() => useChatbot(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("question métier sans réponse locale xyz");
    });

    await waitFor(() => {
      expect(mockOpenDocumentPreview).toHaveBeenCalledWith("iv-fourche", "invoice", true);
      expect(mockEnsureRightPanelOpen).toHaveBeenCalled();
    });
  });

  it("attaches quick_actions from SSE to the assistant message", async () => {
    const lecotActions = [
      {
        id: "lecot-order-1-LEC-2001",
        label: "Commander · Serrure",
        kind: "send_message" as const,
        payload: "Commander LEC-2001 — Serrure",
        variant: "primary" as const,
      },
    ];
    const assistantText = "**Catalogue Lecot** — 3 articles trouvés.";

    mockFetchWithAuth.mockResolvedValue(
      streamResponse([
        { type: "text", delta: assistantText },
        { type: "quick_actions", actions: lecotActions },
        { type: "done", apiMessages: [{ role: "assistant", content: assistantText }] },
      ]),
    );

    const { result } = renderHook(() => useChatbot(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("je cherche une serrure");
    });

    await waitFor(() => {
      expect(result.current.streaming).toBe(false);
      const last = result.current.activeConversation?.messages.at(-1);
      expect(last?.role).toBe("assistant");
      expect(last?.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "lecot-order-1-LEC-2001", payload: lecotActions[0].payload }),
        ]),
      );
    });
  });

  it("opens invoice preview when stream emits document_preview after assistant text", async () => {
    const assistantText =
      "La facture pour l'intervention de Monsieur Vatsaev à la Rue de la Fourche 9 est déjà créée avec un total de 350 €.";

    mockFetchWithAuth.mockResolvedValue(
      streamResponse([
        { type: "text", delta: assistantText },
        {
          type: "document_preview",
          interventionId: "iv-fourche",
          documentType: "invoice",
        },
        { type: "done", apiMessages: [{ role: "assistant", content: assistantText }] },
      ]),
    );

    const { result } = renderHook(() => useChatbot(), { wrapper });

    await act(async () => {
      await result.current.sendMessage("xyzqwerty réponse serveur uniquement");
    });

    await waitFor(() => {
      expect(result.current.streaming).toBe(false);
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        "/api/ai/chatbot",
        expect.objectContaining({ method: "POST" }),
      );
      expect(mockOpenDocumentPreview).toHaveBeenCalledWith("iv-fourche", "invoice", true);
    });
  });


});
