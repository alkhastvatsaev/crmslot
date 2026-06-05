/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { useHubAgent } from "@/features/hubAgents/useHubAgent";

const mockFetchWithAuth = jest.fn();

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: (...args: unknown[]) => mockFetchWithAuth(...args),
}));

jest.mock("@/context/CompanyWorkspaceContext", () => ({
  useCompanyWorkspaceOptional: () => ({
    activeCompanyId: "co-test",
    firebaseUid: "uid-test",
    isTenantUser: false,
    activeRole: "admin",
    memberships: [{ companyId: "co-test", companyName: "Test SA", role: "admin" }],
  }),
}));

jest.mock("@/features/chatbot/chatbot-message-trim", () => ({
  trimChatbotMessagesForApi: (msgs: unknown[]) => msgs,
}));

jest.mock("@/features/chatbot/chatbot-stored-messages", () => ({
  normalizeStoredMessages: (msgs: unknown[]) => msgs,
}));

function makeStream(lines: string[]): Response {
  const body = lines.join("\n") + "\n";
  const encoded = new TextEncoder().encode(body);
  const chunks: Array<Uint8Array | null> = [encoded, null];
  let idx = 0;
  const mockReader = {
    read: jest.fn(async () => {
      const chunk = chunks[idx++];
      if (chunk === null) return { done: true as const, value: undefined };
      return { done: false as const, value: chunk };
    }),
  };
  return {
    ok: true,
    status: 200,
    body: { getReader: () => mockReader },
  } as unknown as Response;
}

const baseConfig = {
  storageKey: "hub-test",
  apiPath: "/api/test-agent",
  idPrefix: "msg",
  companyId: "co-test",
  isInScope: (text: string) => !text.includes("hors-sujet"),
  offTopicText: "Je ne peux pas répondre à ça.",
  offTopicSuggestions: ["Essayez autre chose"],
  buildRequestBody: ({ messages }: { companyId: string; companyName: string; role: string | null; messages: unknown[] }) => ({
    messages,
  }),
};

describe("useHubAgent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("initialises with empty messages and not thinking", () => {
    const { result } = renderHook(() => useHubAgent(baseConfig));
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.thinking).toBe(false);
    expect(result.current.enabled).toBe(true);
  });

  it("disabled when config.enabled is false", () => {
    const { result } = renderHook(() =>
      useHubAgent({ ...baseConfig, enabled: false }),
    );
    expect(result.current.enabled).toBe(false);
  });

  it("off-topic message returns canned response without API call", async () => {
    const { result } = renderHook(() => useHubAgent(baseConfig));
    await act(async () => {
      await result.current.sendMessage("hors-sujet question");
    });
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
    const msgs = result.current.messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.role).toBe("user");
    expect(msgs[1]?.role).toBe("assistant");
    expect(msgs[1]?.text).toBe("Je ne peux pas répondre à ça.");
    expect(msgs[1]?.suggestions).toContain("Essayez autre chose");
  });

  it("sends message and parses text response", async () => {
    mockFetchWithAuth.mockResolvedValue(
      makeStream([
        JSON.stringify({ type: "text", delta: "Bonjour " }),
        JSON.stringify({ type: "text", delta: "monde" }),
        JSON.stringify({ type: "done", apiMessages: [] }),
      ]),
    );

    const { result } = renderHook(() => useHubAgent(baseConfig));
    await act(async () => {
      await result.current.sendMessage("Bonjour");
    });

    const msgs = result.current.messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[1]?.text).toBe("Bonjour monde");
    expect(result.current.thinking).toBe(false);
  });

  it("extracts suggestions from response text", async () => {
    mockFetchWithAuth.mockResolvedValue(
      makeStream([
        JSON.stringify({
          type: "text",
          delta: "Voici ma réponse.<suggestion>Voir factures</suggestion><suggestion>Voir clients</suggestion>",
        }),
        JSON.stringify({ type: "done" }),
      ]),
    );

    const { result } = renderHook(() => useHubAgent(baseConfig));
    await act(async () => {
      await result.current.sendMessage("Quoi faire?");
    });

    const reply = result.current.messages[1];
    expect(reply?.text).toBe("Voici ma réponse.");
    expect(reply?.suggestions).toEqual(["Voir factures", "Voir clients"]);
  });

  it("handles HTTP error response gracefully", async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: "Non autorisé" }),
    } as unknown as Response);

    const { result } = renderHook(() => useHubAgent(baseConfig));
    await act(async () => {
      await result.current.sendMessage("Dossier X");
    });

    const reply = result.current.messages[1];
    expect(reply?.text).toContain("Non autorisé");
    expect(result.current.thinking).toBe(false);
  });

  it("handles network error gracefully", async () => {
    mockFetchWithAuth.mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useHubAgent(baseConfig));
    await act(async () => {
      await result.current.sendMessage("Test réseau");
    });

    const reply = result.current.messages[1];
    expect(reply?.text).toContain("Network failure");
    expect(result.current.thinking).toBe(false);
  });

  it("resetConversation clears messages and localStorage", async () => {
    mockFetchWithAuth.mockResolvedValue(
      makeStream([
        JSON.stringify({ type: "text", delta: "OK" }),
        JSON.stringify({ type: "done" }),
      ]),
    );

    const { result } = renderHook(() => useHubAgent(baseConfig));
    await act(async () => {
      await result.current.sendMessage("Premier message");
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.resetConversation();
    });
    expect(result.current.messages).toHaveLength(0);
  });

  it("ignores empty sendMessage calls", async () => {
    const { result } = renderHook(() => useHubAgent(baseConfig));
    await act(async () => {
      await result.current.sendMessage("   ");
    });
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it("fires onStreamEvent for each event", async () => {
    const onStreamEvent = jest.fn();
    mockFetchWithAuth.mockResolvedValue(
      makeStream([
        JSON.stringify({ type: "tool_start", tool: "list_clients", label: "Clients" }),
        JSON.stringify({ type: "tool_end", tool: "list_clients" }),
        JSON.stringify({ type: "text", delta: "Voilà." }),
        JSON.stringify({ type: "done" }),
      ]),
    );

    const { result } = renderHook(() =>
      useHubAgent({ ...baseConfig, onStreamEvent }),
    );
    await act(async () => {
      await result.current.sendMessage("Liste les clients");
    });

    expect(onStreamEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tool_start", tool: "list_clients" }),
    );
    expect(onStreamEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "tool_end" }),
    );
  });
});
