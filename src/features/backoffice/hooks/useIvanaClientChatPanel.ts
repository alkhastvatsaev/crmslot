"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { isConfigured, storage } from "@/core/config/firebase";
import {
  IVANA_PORTAL_MESSAGE_EVENT,
  type ClientPortalChatPayload,
} from "@/features/backoffice/ivanaChatPortalBridge";
import { resolveIvanaChatFirebaseSession } from "@/features/backoffice/resolveIvanaChatFirebaseSession";
import { isVerifiedClientPortalUser } from "@/features/auth/hooks/useClientPortalAccount";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  type IvanaChatMessage,
  IVANA_CHAT_STORAGE_PREFIX,
  IVANA_CHAT_PERSISTENCE_ENABLED,
  ivanaWelcomeMessage,
} from "@/features/backoffice/ivanaChatTypes";
import { useIvanaClientChatFirestoreSync } from "@/features/backoffice/hooks/useIvanaClientChatFirestoreSync";
import { useIvanaClientChatSend } from "@/features/backoffice/hooks/useIvanaClientChatSend";

export type UseIvanaClientChatPanelArgs = {
  publishAsPortal?: boolean;
  acceptPortalMessages?: boolean;
  chatCompanyId?: string | null;
  chatInterventionId?: string | null;
  onRemoteClientMessage?: () => void;
};

export function useIvanaClientChatPanel({
  publishAsPortal = false,
  acceptPortalMessages = false,
  chatCompanyId = null,
  chatInterventionId = null,
  onRemoteClientMessage,
}: UseIvanaClientChatPanelArgs) {
  const { t } = useTranslation();
  const { fields: staffFields } = useCrmStaffAccountPanel();
  const { profile: requesterProfile, clientAccountFields } = useRequesterHub();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<IvanaChatMessage[]>(() => [ivanaWelcomeMessage(t)]);
  const [draft, setDraft] = useState("");
  const [ivanaTyping, setIvanaTyping] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const seenPortalIdsRef = useRef<Set<string>>(new Set());
  const pendingDocIdRef = useRef<Map<string, string>>(new Map());

  const { chatAuth, chatDb } = useMemo(
    () => resolveIvanaChatFirebaseSession(publishAsPortal),
    [publishAsPortal]
  );

  const companyIdTrimmed = (chatCompanyId ?? "").trim();
  const portalAuthReady = !publishAsPortal || isVerifiedClientPortalUser(user);
  const firestoreSyncEnabled = Boolean(
    companyIdTrimmed && isConfigured && chatDb && portalAuthReady
  );
  const attachImagesBlocked = Boolean(firestoreSyncEnabled && !storage);

  const storageKey = useMemo(
    () => `${IVANA_CHAT_STORAGE_PREFIX}:${user?.uid ?? "anonymous"}`,
    [user?.uid]
  );

  useEffect(() => {
    if (!chatAuth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(chatAuth, setUser);
  }, [chatAuth]);

  useEffect(() => {
    if (typeof window === "undefined" || firestoreSyncEnabled) return;
    let cancelled = false;
    hydratedRef.current = false;

    if (!IVANA_CHAT_PERSISTENCE_ENABLED) {
      if (!cancelled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages([ivanaWelcomeMessage(t)]);
        hydratedRef.current = true;
      }
      return () => {
        cancelled = true;
      };
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as IvanaChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (!cancelled) {
            setMessages(parsed);
            hydratedRef.current = true;
          }
          return;
        }
      }
    } catch {
      /* ignore */
    }
    if (!cancelled) {
      setMessages([ivanaWelcomeMessage(t)]);
      hydratedRef.current = true;
    }
    return () => {
      cancelled = true;
    };
  }, [storageKey, firestoreSyncEnabled, t]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined" || firestoreSyncEnabled) return;
    if (!IVANA_CHAT_PERSISTENCE_ENABLED) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, storageKey, firestoreSyncEnabled]);

  useIvanaClientChatFirestoreSync(
    firestoreSyncEnabled,
    chatDb,
    companyIdTrimmed,
    chatAuth,
    chatInterventionId,
    onRemoteClientMessage,
    t,
    setMessages,
    pendingDocIdRef
  );

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, ivanaTyping]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 96);
    el.style.height = `${Math.max(next, 48)}px`;
  }, [draft]);

  useEffect(() => {
    if (!acceptPortalMessages || firestoreSyncEnabled) return;
    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<ClientPortalChatPayload>;
      const d = ce.detail;
      if (!d || typeof d.id !== "string") return;
      const mid = `portal-${d.id}`;
      if (seenPortalIdsRef.current.has(mid)) return;
      seenPortalIdsRef.current.add(mid);
      setMessages((prev) => [
        ...prev,
        {
          id: mid,
          role: "client" as const,
          text: d.text,
          images: d.images,
          createdAt: d.createdAt,
        },
      ]);
    };
    window.addEventListener(IVANA_PORTAL_MESSAGE_EVENT, handler as EventListener);
    return () => window.removeEventListener(IVANA_PORTAL_MESSAGE_EVENT, handler as EventListener);
  }, [acceptPortalMessages, firestoreSyncEnabled]);

  const { handlePickImages, send } = useIvanaClientChatSend({
    draft,
    setDraft,
    pendingImages,
    setPendingImages,
    ivanaTyping,
    setIvanaTyping,
    setMessages,
    fileInputRef,
    pendingDocIdRef,
    publishAsPortal,
    portalAuthReady,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    chatInterventionId,
    staffFields,
    clientAccountFields,
    requesterProfile,
    t,
  });

  return {
    messages,
    ivanaTyping,
    draft,
    setDraft,
    pendingImages,
    setPendingImages,
    listRef,
    inputRef,
    fileInputRef,
    handlePickImages,
    send,
    attachImagesBlocked,
    publishAsPortal,
    companyIdTrimmed,
    portalAuthReady,
  };
}
