"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { useWorkspaceCopilotSnapshot } from "@/features/copilot/hooks/useWorkspaceCopilotSnapshot";
import { buildChatbotSuggestions } from "@/features/chatbot/buildChatbotSuggestions";
import type {
  ChatbotConversation,
  ChatbotPendingTool,
  ChatbotStreamEvent,
  ChatbotUiMessage,
} from "@/features/chatbot/chatbot-types";

const STORAGE_PREFIX = "belmap-chatbot-v1";

function loadConversations(key: string): ChatbotConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatbotConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(key: string, rows: ChatbotConversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(rows.slice(0, 30)));
  } catch {
    /* quota */
  }
}

async function readChatbotStream(
  res: Response,
  onEvent: (ev: ChatbotStreamEvent) => void,
): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Erreur HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string; message?: string };
      message = json.error || json.message || message;
    } catch {
      if (text.trim()) message = text.slice(0, 400);
    }
    onEvent({ type: "error", message });
    return;
  }

  if (!res.body) throw new Error("Réponse vide du serveur");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onEvent(JSON.parse(line) as ChatbotStreamEvent);
      } catch {
        /* ligne non JSON */
      }
    }
  }
  if (buffer.trim()) {
    try {
      onEvent(JSON.parse(buffer) as ChatbotStreamEvent);
    } catch {
      /* ignore */
    }
  }
}

function resolveCompanyId(workspace: ReturnType<typeof useCompanyWorkspaceOptional>): string | null {
  const id = (workspace?.activeCompanyId ?? "").trim();
  if (id) return id;
  if (workspace?.isTenantUser) return DEMO_COMPANY_ID;
  return null;
}

export function useChatbot() {
  const workspace = useCompanyWorkspaceOptional();
  const companyId = resolveCompanyId(workspace);
  const companyName =
    workspace?.memberships.find((m) => m.companyId === companyId)?.companyName ??
    (companyId === DEMO_COMPANY_ID ? "Société démo" : null);
  const role = workspace?.activeRole ?? null;
  const uid = workspace?.firebaseUid ?? "anon";
  const { snapshot: workspaceSnapshot } = useWorkspaceCopilotSnapshot();
  const suggestions = useMemo(
    () => buildChatbotSuggestions(workspaceSnapshot),
    [workspaceSnapshot],
  );

  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}:${uid}:${companyId ?? "none"}`,
    [uid, companyId],
  );

  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [pendingTool, setPendingTool] = useState<ChatbotPendingTool | null>(null);
  const [activeTool, setActiveTool] = useState<{ tool: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rows = loadConversations(storageKey);
    setConversations(rows);
    setActiveId(rows[0]?.id ?? null);
    setPendingTool(null);
    setError(null);
  }, [storageKey]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const persist = useCallback(
    (rows: ChatbotConversation[]) => {
      setConversations(rows);
      saveConversations(storageKey, rows);
    },
    [storageKey],
  );

  const appendToConversation = useCallback(
    (
      convId: string,
      patch: {
        uiMessages?: ChatbotUiMessage[];
        apiMessages?: unknown[];
        title?: string;
      },
    ) => {
      setConversations((prev) => {
        const next = prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: patch.uiMessages ?? c.messages,
                apiMessages: patch.apiMessages ?? c.apiMessages,
                title: patch.title ?? c.title,
                updatedAt: Date.now(),
              }
            : c,
        );
        saveConversations(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const newConversation = useCallback(() => {
    const conv: ChatbotConversation = {
      id: crypto.randomUUID(),
      title: "Nouvelle conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      apiMessages: [],
    };
    persist([conv, ...conversations]);
    setActiveId(conv.id);
    setPendingTool(null);
    setStreamingText("");
    setError(null);
  }, [conversations, persist]);

  const runStream = useCallback(
    async (
      convId: string,
      apiHistory: unknown[],
      extra?: {
        confirmTool?: { toolUseId: string; name: string; input: Record<string, unknown> };
      },
    ) => {
      if (!companyId) {
        setError("Sélectionnez une société active (switcher en haut) pour utiliser le Chatbot.");
        return;
      }

      setStreaming(true);
      setStreamingText("");
      setActiveTool(null);
      setError(null);

      let accText = "";
      let streamError: string | null = null;
      let nextApi = apiHistory;

      try {
        const res = await fetchWithAuth("/api/ai/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyId,
            companyName,
            role,
            messages: apiHistory,
            workspaceSnapshot: workspaceSnapshot ?? undefined,
            ...extra,
          }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`Erreur ${res.status}: ${body.slice(0, 200)}`);
        }

        await readChatbotStream(res, (ev) => {
          if (ev.type === "text") {
            accText += ev.delta;
            setStreamingText(accText);
          }
          if (ev.type === "tool_start") {
            setActiveTool({ tool: ev.tool, label: ev.label });
          }
          if (ev.type === "tool_end") {
            setActiveTool(null);
          }
          if (ev.type === "tool_pending") {
            setPendingTool(ev.pending);
          }
          if (ev.type === "done" && ev.apiMessages) {
            nextApi = ev.apiMessages;
          }
          if (ev.type === "error") {
            streamError = ev.message;
            setError(ev.message);
          }
        });

        const finalText = (accText.trim() || streamError || "").trim();
        if (finalText) {
          setConversations((prev) => {
            const conv = prev.find((c) => c.id === convId);
            if (!conv) return prev;
            const assistantMsg: ChatbotUiMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: finalText,
              createdAt: Date.now(),
            };
            const uiMessages = [...conv.messages, assistantMsg];
            const next = prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: uiMessages,
                    apiMessages: nextApi,
                    updatedAt: Date.now(),
                    title:
                      c.title === "Nouvelle conversation" && uiMessages[0]
                        ? uiMessages[0].content.slice(0, 48)
                        : c.title,
                  }
                : c,
            );
            saveConversations(storageKey, next);
            return next;
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur réseau Chatbot";
        setError(msg);
        appendToConversation(convId, {
          uiMessages: [
            ...(conversations.find((c) => c.id === convId)?.messages ?? []),
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `⚠️ ${msg}`,
              createdAt: Date.now(),
            },
          ],
        });
      } finally {
        setStreaming(false);
        setStreamingText("");
        setActiveTool(null);
      }
    },
    [appendToConversation, companyId, companyName, conversations, role, storageKey, workspaceSnapshot],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      if (!companyId) {
        setError("Sélectionnez une société active pour utiliser le Chatbot.");
        return;
      }

      let convId = activeId;
      if (!convId) {
        const conv: ChatbotConversation = {
          id: crypto.randomUUID(),
          title: trimmed.slice(0, 48),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          apiMessages: [],
        };
        persist([conv, ...conversations]);
        convId = conv.id;
        setActiveId(convId);
      }

      const userMsg: ChatbotUiMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      const conv =
        conversations.find((c) => c.id === convId) ??
        ({
          id: convId,
          title: trimmed.slice(0, 48),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          apiMessages: [],
        } satisfies ChatbotConversation);

      const nextUi = [...conv.messages, userMsg];
      const nextApi = [...(conv.apiMessages ?? []), { role: "user", content: trimmed }];

      appendToConversation(convId, { uiMessages: nextUi, apiMessages: nextApi });

      await runStream(convId, nextApi);
    },
    [activeId, appendToConversation, companyId, conversations, persist, runStream, streaming],
  );

  const confirmPendingTool = useCallback(async () => {
    if (!pendingTool || !companyId || !activeId) return;
    const tool = pendingTool;
    setPendingTool(null);
    const conv = conversations.find((c) => c.id === activeId);
    const apiHistory = conv?.apiMessages ?? [];
    await runStream(activeId, apiHistory, {
      confirmTool: {
        toolUseId: tool.toolUseId,
        name: tool.name,
        input: tool.input,
      },
    });
  }, [activeId, companyId, conversations, pendingTool, runStream]);

  const cancelPendingTool = useCallback(() => {
    if (!activeId) return;
    setPendingTool(null);
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;
    appendToConversation(activeId, {
      uiMessages: [
        ...conv.messages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Action annulée — aucune modification n'a été effectuée.",
          createdAt: Date.now(),
        },
      ],
    });
  }, [activeId, appendToConversation, conversations]);

  return {
    companyId,
    companyName,
    workspaceSnapshot,
    suggestions,
    conversations,
    activeConversation,
    activeId,
    setActiveId,
    newConversation,
    sendMessage,
    streaming,
    streamingText,
    activeTool,
    pendingTool,
    confirmPendingTool,
    cancelPendingTool,
    error,
  };
}
