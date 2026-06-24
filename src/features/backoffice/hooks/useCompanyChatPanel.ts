"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { isConfigured } from "@/core/config/firebase";
import {
  PORTAL_CHAT_MESSAGE_EVENT,
  type ClientPortalChatPayload,
} from "@/features/backoffice/portalChatBridge";
import { ensureClientPortalChatAuth } from "@/features/backoffice/ensureClientPortalChatAuth";
import { resolvePortalChatFirebaseSession } from "@/features/backoffice/resolvePortalChatFirebaseSession";
import { isClientPortalChatUser } from "@/features/auth/hooks/useClientPortalAccount";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  type CompanyChatMessage,
  COMPANY_CHAT_STORAGE_PREFIX,
  COMPANY_CHAT_PERSISTENCE_ENABLED,
  companyChatWelcomeMessage,
} from "@/features/backoffice/companyChatTypes";
import { useCompanyChatFirestoreSync } from "@/features/backoffice/hooks/useCompanyChatFirestoreSync";
import { useCompanyChatSend } from "@/features/backoffice/hooks/useCompanyChatSend";
import { usePortalChatProfileBootstrap } from "@/features/backoffice/hooks/usePortalChatProfileBootstrap";
import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";

export type UseCompanyChatPanelArgs = {
  publishAsPortal?: boolean;
  acceptPortalMessages?: boolean;
  chatCompanyId?: string | null;
  chatInterventionId?: string | null;
  chatThreadId?: string | null;
  onRemoteClientMessage?: () => void;
};

export function useCompanyChatPanel({
  publishAsPortal = false,
  acceptPortalMessages = false,
  chatCompanyId = null,
  chatInterventionId = null,
  chatThreadId = null,
  onRemoteClientMessage,
}: UseCompanyChatPanelArgs) {
  const { t } = useTranslation();
  const { fields: staffFields } = useCrmStaffAccountPanel();
  const { profile: requesterProfile, clientAccountFields } = useRequesterHub();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<CompanyChatMessage[]>(() => [
    companyChatWelcomeMessage(t),
  ]);
  const [draft, setDraft] = useState("");
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);
  const seenPortalIdsRef = useRef<Set<string>>(new Set());
  const pendingDocIdRef = useRef<Map<string, string>>(new Map());
  const portalChatRowsRef = useRef<PortalChatDoc[]>([]);

  const filterThreadId = chatThreadId ?? chatInterventionId;

  const { chatAuth, chatDb, chatStorage } = useMemo(
    () => resolvePortalChatFirebaseSession(publishAsPortal),
    [publishAsPortal]
  );

  const companyIdTrimmed = (chatCompanyId ?? "").trim();
  const portalAuthReady = !publishAsPortal || isClientPortalChatUser(user);
  const { ready: portalProfileReady, errorKey: portalProfileErrorKey } =
    usePortalChatProfileBootstrap(publishAsPortal, companyIdTrimmed, user, portalAuthReady);
  const firestoreSyncEnabled = Boolean(
    companyIdTrimmed && isConfigured && chatDb && portalAuthReady && portalProfileReady
  );
  const attachImagesBlocked = Boolean(firestoreSyncEnabled && !chatStorage);

  const storageKey = useMemo(
    () => `${COMPANY_CHAT_STORAGE_PREFIX}:${user?.uid ?? "anonymous"}`,
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
    if (!publishAsPortal || !chatAuth || !companyIdTrimmed) return;
    let cancelled = false;
    void ensureClientPortalChatAuth(chatAuth).then((nextUser) => {
      if (!cancelled && nextUser) setUser(nextUser);
    });
    return () => {
      cancelled = true;
    };
  }, [publishAsPortal, chatAuth, companyIdTrimmed]);

  useEffect(() => {
    if (typeof window === "undefined" || firestoreSyncEnabled) return;
    let cancelled = false;
    hydratedRef.current = false;

    if (!COMPANY_CHAT_PERSISTENCE_ENABLED) {
      if (!cancelled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages([companyChatWelcomeMessage(t)]);
        hydratedRef.current = true;
      }
      return () => {
        cancelled = true;
      };
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as CompanyChatMessage[];
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
      setMessages([companyChatWelcomeMessage(t)]);
      hydratedRef.current = true;
    }
    return () => {
      cancelled = true;
    };
  }, [storageKey, firestoreSyncEnabled, t]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined" || firestoreSyncEnabled) return;
    if (!COMPANY_CHAT_PERSISTENCE_ENABLED) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, storageKey, firestoreSyncEnabled]);

  useCompanyChatFirestoreSync(
    firestoreSyncEnabled,
    chatDb,
    companyIdTrimmed,
    chatAuth,
    filterThreadId,
    publishAsPortal,
    portalChatRowsRef,
    onRemoteClientMessage,
    t,
    setMessages,
    pendingDocIdRef
  );

  useEffect(() => {
    stickToBottomRef.current = true;
  }, [filterThreadId, companyIdTrimmed]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = distance < 96;
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [filterThreadId, companyIdTrimmed]);

  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, assistantTyping]);

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
    window.addEventListener(PORTAL_CHAT_MESSAGE_EVENT, handler as EventListener);
    return () => window.removeEventListener(PORTAL_CHAT_MESSAGE_EVENT, handler as EventListener);
  }, [acceptPortalMessages, firestoreSyncEnabled]);

  const { handlePickImages, send } = useCompanyChatSend({
    draft,
    setDraft,
    pendingImages,
    setPendingImages,
    assistantTyping,
    setAssistantTyping,
    setMessages,
    fileInputRef,
    pendingDocIdRef,
    publishAsPortal,
    portalAuthReady,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    chatStorage,
    chatInterventionId,
    chatThreadId: filterThreadId,
    portalChatRowsRef,
    portalProfileReady,
    staffFields,
    clientAccountFields,
    requesterProfile,
    t,
  });

  return {
    messages,
    assistantTyping,
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
    portalProfileErrorKey,
    portalProfileReady,
  };
}
