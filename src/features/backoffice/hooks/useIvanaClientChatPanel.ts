"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { toast } from "sonner";
import { isConfigured, storage } from "@/core/config/firebase";
import {
  publishClientPortalMessage,
  IVANA_PORTAL_MESSAGE_EVENT,
  type ClientPortalChatPayload,
} from "@/features/backoffice/ivanaChatPortalBridge";
import {
  sendIvanaPortalMessage,
  subscribeIvanaPortalMessages,
} from "@/features/backoffice/ivanaChatFirestore";
import { ensureIvanaChatPortalProfile } from "@/features/backoffice/ensureIvanaChatPortalProfile";
import { resolveIvanaChatFirebaseSession } from "@/features/backoffice/resolveIvanaChatFirebaseSession";
import { uploadIvanaChatImagesFromDataUrls } from "@/features/backoffice/ivanaChatStorage";
import { logger } from "@/core/logger";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import { requestStaffPortalChatNotification } from "@/features/backoffice/requestStaffPortalChatNotification";
import { requestClientPortalChatNotification } from "@/features/backoffice/requestClientPortalChatNotification";
import { filterPortalChatMessagesForThread } from "@/features/backoffice/portalChatThreadFilter";
import { resolveIvanaChatSenderName } from "@/features/backoffice/resolveIvanaChatSenderName";
import { isVerifiedClientPortalUser } from "@/features/auth/hooks/useClientPortalAccount";
import { useCrmStaffAccountPanel } from "@/features/auth/hooks/useCrmStaffAccountPanel";
import { useRequesterHub } from "@/features/interventions/context/RequesterHubContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  type IvanaChatMessage,
  IVANA_CHAT_STORAGE_PREFIX,
  IVANA_CHAT_PERSISTENCE_ENABLED,
  pickIvanaReply,
  ivanaWelcomeMessage,
} from "@/features/backoffice/ivanaChatTypes";

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
  const fsHydratedRef = useRef(false);
  const seenFsIdsRef = useRef<Set<string>>(new Set());
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
    fsHydratedRef.current = false;
    seenFsIdsRef.current.clear();
  }, [companyIdTrimmed]);

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
  }, [storageKey, firestoreSyncEnabled]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined" || firestoreSyncEnabled) return;
    if (!IVANA_CHAT_PERSISTENCE_ENABLED) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages, storageKey, firestoreSyncEnabled]);

  useEffect(() => {
    if (!firestoreSyncEnabled || !chatDb || !companyIdTrimmed) return;

    const unsub = subscribeIvanaPortalMessages(
      chatDb,
      companyIdTrimmed,
      (rows) => {
        const filteredRows = filterPortalChatMessagesForThread(rows, chatInterventionId);

        const mapped: IvanaChatMessage[] = filteredRows
          .map((r) => {
            const ts = coerceFirestoreLikeDate(r.createdAt)?.getTime() ?? Date.now();
            let role: IvanaChatMessage["role"] = "user";
            if (r.role === "client") role = "client";
            else if (r.role === "staff") role = "staff";
            return {
              id: `fs-${r.id}`,
              role,
              text: r.body,
              createdAt: ts,
              senderName: typeof r.senderName === "string" ? r.senderName : undefined,
              senderUid: r.senderUid,
              images:
                Array.isArray(r.imageUrls) && r.imageUrls.length > 0 ? r.imageUrls : undefined,
            };
          })
          .sort((a, b) => a.createdAt - b.createdAt);

        if (!fsHydratedRef.current) {
          fsHydratedRef.current = true;
          rows.forEach((r) => seenFsIdsRef.current.add(r.id));
        }

        const uid = chatAuth?.currentUser?.uid;
        const newDocs = rows.filter((r) => !seenFsIdsRef.current.has(r.id));
        newDocs.forEach((r) => seenFsIdsRef.current.add(r.id));
        if (
          onRemoteClientMessage &&
          uid &&
          newDocs.some((r) => r.role === "client" && r.senderUid !== uid)
        ) {
          onRemoteClientMessage();
        }

        setMessages((prev) => {
          const confirmedIds = new Set(filteredRows.map((r) => r.id));
          const contentKeys = new Set(
            filteredRows.map((r) => `${(r.senderUid ?? "").trim()}::${r.body}`)
          );
          const optimistic = prev.filter((m) => {
            if (!m.id.startsWith("pending-")) return false;
            if (m.failed) return true;
            const tempId = m.id.slice("pending-".length);
            const docId = pendingDocIdRef.current.get(tempId);
            if (docId && confirmedIds.has(docId)) {
              pendingDocIdRef.current.delete(tempId);
              return false;
            }
            if (contentKeys.has(`${(m.senderUid ?? "").trim()}::${m.text}`)) {
              pendingDocIdRef.current.delete(tempId);
              return false;
            }
            return true;
          });
          const base =
            mapped.length === 0 && optimistic.length === 0 ? [ivanaWelcomeMessage(t)] : mapped;
          return [...base, ...optimistic].sort((a, b) => a.createdAt - b.createdAt);
        });
      },
      (err) => {
        logger.error("[IvanaClientChatPanel] Firestore chat", {
          error: err instanceof Error ? err.message : String(err),
        });
        toast.error("Chat", { description: err.message });
      }
    );
    return unsub;
  }, [
    firestoreSyncEnabled,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    chatInterventionId,
    onRemoteClientMessage,
    t,
  ]);

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

  const handlePickImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const allowed = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (allowed.length === 0) return;

      const MAX_FILES = 6;
      const MAX_TOTAL = 6;
      const remaining = Math.max(0, MAX_TOTAL - pendingImages.length);
      const sliced = allowed.slice(0, Math.min(MAX_FILES, remaining));

      const readOne = (file: File) =>
        new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onerror = () => resolve(null);
          reader.onload = () => {
            const v = reader.result;
            resolve(typeof v === "string" ? v : null);
          };
          reader.readAsDataURL(file);
        });

      const newUrls = (await Promise.all(sliced.map(readOne))).filter(Boolean) as string[];
      if (newUrls.length > 0) setPendingImages((prev) => [...prev, ...newUrls]);

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [pendingImages.length]
  );

  const send = useCallback(async () => {
    const text = draft.trim();
    if ((!text && pendingImages.length === 0) || ivanaTyping) return;

    const wantsFirestore = Boolean(companyIdTrimmed && isConfigured && chatDb);

    if (wantsFirestore) {
      if (publishAsPortal && !portalAuthReady) {
        toast.error(t("chat.toast_login_required"), {
          description: t("chat.toast_login_description"),
        });
        return;
      }
      if (!chatAuth?.currentUser) {
        toast.error(t("chat.toast_login_required"), {
          description: t("chat.toast_login_description"),
        });
        return;
      }

      if (pendingImages.length > 0 && !storage) {
        toast.error("Chat", {
          description: t("chat.toast_storage_unavailable"),
        });
        return;
      }

      const role = publishAsPortal ? "client" : "staff";
      const currentUser = chatAuth.currentUser;
      const senderName = resolveIvanaChatSenderName({
        publishAsPortal,
        user: currentUser,
        staffFields,
        clientAccountFields,
        requesterProfile,
        t,
      });
      const tempId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticImages = pendingImages.length > 0 ? [...pendingImages] : undefined;
      const optimisticMsg: IvanaChatMessage = {
        id: `pending-${tempId}`,
        role,
        text,
        createdAt: Date.now(),
        senderName,
        senderUid: currentUser.uid,
        images: optimisticImages,
        pending: true,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setDraft("");
      setPendingImages([]);

      try {
        if (publishAsPortal) {
          await ensureIvanaChatPortalProfile(chatDb, currentUser, companyIdTrimmed);
        }
        let imageUrls: string[] | undefined;
        if (optimisticImages && optimisticImages.length > 0 && storage) {
          imageUrls = await uploadIvanaChatImagesFromDataUrls(storage, {
            companyId: companyIdTrimmed,
            uid: currentUser.uid,
            dataUrls: optimisticImages,
          });
        }
        const docId = await sendIvanaPortalMessage(chatDb, {
          companyId: companyIdTrimmed,
          body: text,
          role,
          senderUid: currentUser.uid,
          senderName,
          interventionId: chatInterventionId,
          ...(imageUrls && imageUrls.length > 0 ? { imageUrls } : {}),
        });
        pendingDocIdRef.current.set(tempId, docId);
        if (imageUrls && imageUrls.length > 0) {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? { ...m, images: imageUrls } : m))
          );
        }
        const preview = text || (imageUrls?.length ? "Photo jointe" : "");
        if (publishAsPortal) {
          void requestStaffPortalChatNotification({
            companyId: companyIdTrimmed,
            interventionId: chatInterventionId,
            preview,
            clientLabel: senderName,
          });
        } else {
          void requestClientPortalChatNotification({
            companyId: companyIdTrimmed,
            interventionId: chatInterventionId,
            preview,
            staffLabel: senderName,
          });
        }
      } catch (e) {
        logger.error("IvanaClientChatPanel send", {
          error: e instanceof Error ? e.message : String(e),
        });
        toast.error("Chat", {
          description: e instanceof Error ? e.message : t("chat.toast_send_failed"),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? { ...m, pending: false, failed: true } : m))
        );
      }
      return;
    }

    const userMsg: IvanaChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      images: pendingImages.length > 0 ? pendingImages : undefined,
      createdAt: Date.now(),
    };
    setDraft("");
    setPendingImages([]);
    setMessages((prev) => [...prev, userMsg]);
    if (publishAsPortal) {
      publishClientPortalMessage({
        id: userMsg.id,
        text: userMsg.text,
        images: userMsg.images,
        createdAt: userMsg.createdAt,
      });
      void requestStaffPortalChatNotification({
        companyId: companyIdTrimmed,
        interventionId: chatInterventionId,
        preview: userMsg.text || (userMsg.images?.length ? "Photo jointe" : ""),
      });
    }
    setIvanaTyping(true);

    const delay = 700 + Math.floor(Math.random() * 600);
    window.setTimeout(() => {
      const reply: IvanaChatMessage = {
        id: `i-${Date.now()}`,
        role: "ivana",
        text: pickIvanaReply(text, t),
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, reply]);
      setIvanaTyping(false);
    }, delay);
  }, [
    draft,
    ivanaTyping,
    pendingImages,
    publishAsPortal,
    firestoreSyncEnabled,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    chatInterventionId,
    t,
    staffFields,
    clientAccountFields,
    requesterProfile,
    portalAuthReady,
  ]);

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
