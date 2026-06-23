"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import type { ChatbotStreamEvent } from "@/features/chatbot";
import { trimChatbotMessagesForApi } from "@/features/chatbot/chatbot-message-trim";
import { normalizeStoredMessages } from "@/features/chatbot/chatbot-stored-messages";
import type { HubAgentMessage } from "@/features/hubAgents/hubAgentTypes";

function extractSuggestions(text: string): string[] {
  const out: string[] = [];
  const re = /<suggestion>(.*?)<\/suggestion>/gi;
  let m = re.exec(text);
  while (m) {
    const s = m[1].trim();
    if (s) out.push(s);
    m = re.exec(text);
  }
  return out;
}

function stripSuggestions(text: string): string {
  return text.replace(/<suggestion>.*?<\/suggestion>/gi, "").trim();
}

async function readStream(res: Response, onEvent: (ev: ChatbotStreamEvent) => void): Promise<void> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Erreur HTTP ${res.status}`;
    try {
      const json = JSON.parse(text) as { error?: string };
      if (json.error) message = json.error;
    } catch {
      if (text.trim()) message = text.slice(0, 300);
    }
    onEvent({ type: "error", message });
    return;
  }
  if (!res.body) return;
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
        /* non-JSON */
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

function loadApiHistory(storageKey: string, uid: string, companyId: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${storageKey}:api:${uid}:${companyId}`);
    return raw ? (JSON.parse(raw) as unknown[]) : [];
  } catch {
    return [];
  }
}

function saveApiHistory(storageKey: string, uid: string, companyId: string, msgs: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${storageKey}:api:${uid}:${companyId}`, JSON.stringify(msgs.slice(-80)));
  } catch {
    /* quota */
  }
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export type UseHubAgentConfig = {
  storageKey: string;
  apiPath: string;
  idPrefix: string;
  companyId: string;
  enabled?: boolean;
  isInScope: (text: string) => boolean;
  offTopicText: string;
  offTopicSuggestions: string[];
  buildRequestBody: (params: {
    companyId: string;
    companyName: string;
    role: string | null;
    messages: unknown[];
  }) => Record<string, unknown>;
  onStreamEvent?: (ev: ChatbotStreamEvent) => void;
};

export function useHubAgent(config: UseHubAgentConfig) {
  const workspace = useCompanyWorkspaceOptional();
  const rawId = (workspace?.activeCompanyId ?? "").trim();
  const resolvedId = rawId || workspace?.activeCompanyId?.trim() || null;
  const companyId = config.companyId || resolvedId || "";
  const uid = workspace?.firebaseUid ?? "anon";
  const companyName =
    workspace?.memberships?.find((m) => m.companyId === companyId)?.companyName ?? null;
  const role = workspace?.activeRole ?? null;

  const agentEnabled = config.enabled !== false && Boolean(companyId);

  const storageKey = useMemo(() => `${uid}:${companyId}`, [uid, companyId]);
  const prevKeyRef = useRef(storageKey);

  const [messages, setMessages] = useState<HubAgentMessage[]>([]);
  const [thinking, setThinking] = useState(false);

  const apiHistoryRef = useRef<unknown[]>(
    companyId ? loadApiHistory(config.storageKey, uid, companyId) : []
  );

  if (prevKeyRef.current !== storageKey) {
    prevKeyRef.current = storageKey;
    apiHistoryRef.current = companyId ? loadApiHistory(config.storageKey, uid, companyId) : [];
  }

  const pushMsg = useCallback((msg: HubAgentMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const resetConversation = useCallback(() => {
    setMessages([]);
    apiHistoryRef.current = [];
    if (companyId) saveApiHistory(config.storageKey, uid, companyId, []);
  }, [uid, companyId, config.storageKey]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || !agentEnabled || thinking) return;

      pushMsg({ id: nextId(config.idPrefix), role: "user", text });

      if (!config.isInScope(text)) {
        pushMsg({
          id: nextId(config.idPrefix),
          role: "assistant",
          text: config.offTopicText,
          suggestions: config.offTopicSuggestions,
        });
        return;
      }

      setThinking(true);

      const nextApi = [...apiHistoryRef.current, { role: "user", content: text }];
      apiHistoryRef.current = nextApi;

      const accText = { v: "" };
      const finalApi = { v: nextApi as unknown[] };

      try {
        const res = await fetchWithAuth(config.apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            config.buildRequestBody({
              companyId,
              companyName: companyName ?? companyId,
              role,
              messages: nextApi,
            })
          ),
        });

        await readStream(res, (ev) => {
          if (ev.type === "text") accText.v += ev.delta;
          if (ev.type === "done" && ev.apiMessages) finalApi.v = ev.apiMessages as unknown[];
          if (ev.type === "error") accText.v = `⚠️ ${ev.message}`;
          config.onStreamEvent?.(ev);
        });

        const rawText = accText.v.trim() || "⚠️ Pas de réponse.";
        const suggestions = extractSuggestions(rawText);
        const displayText = stripSuggestions(rawText);

        const trimmed = trimChatbotMessagesForApi(normalizeStoredMessages(finalApi.v));
        apiHistoryRef.current = trimmed;
        if (companyId) saveApiHistory(config.storageKey, uid, companyId, trimmed);

        pushMsg({
          id: nextId(config.idPrefix),
          role: "assistant",
          text: displayText,
          ...(suggestions.length ? { suggestions } : {}),
        });
      } catch (e) {
        pushMsg({
          id: nextId(config.idPrefix),
          role: "assistant",
          text: `⚠️ ${e instanceof Error ? e.message : "Erreur réseau"}`,
        });
      } finally {
        setThinking(false);
      }
    },
    [agentEnabled, thinking, companyId, companyName, role, config, pushMsg]
  );

  return {
    messages,
    thinking,
    sendMessage,
    resetConversation,
    enabled: agentEnabled,
  };
}
