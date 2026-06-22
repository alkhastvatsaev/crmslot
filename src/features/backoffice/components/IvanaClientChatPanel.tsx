"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ImagePlus, X } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { toast } from "sonner";
import { isConfigured, storage } from "@/core/config/firebase";
import { cn } from "@/lib/utils";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
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

const STORAGE_PREFIX = "map-belgique-ivana-chat-v1";
const CHAT_PERSISTENCE_ENABLED = false;

export type IvanaChatMessage = {
  id: string;
  role: "user" | "ivana" | "client" | "staff";
  text: string;
  images?: string[];
  createdAt: number;
  senderName?: string;
  senderUid?: string;
  pending?: boolean;
  failed?: boolean;
};

function pickIvanaReply(userText: string, t: (key: string) => string): string {
  const lower = userText.toLowerCase();
  if (/\burgent|urgence|immédiat|rapide\b/.test(lower)) return t("chat.reply_urgent");
  if (/\bfacture|facturation|paiement|devis\b/.test(lower)) return t("chat.reply_billing");
  if (/\brdv|rendez-vous|créneau|horaire|planif\b/.test(lower)) return t("chat.reply_schedule");
  if (/\bmerci|thanks\b/.test(lower)) return t("chat.reply_thanks");
  return t("chat.reply_default");
}

function welcomeMessage(t: (key: string) => string): IvanaChatMessage {
  return {
    id: "welcome",
    role: "ivana",
    text: t("chat.welcome"),
    createdAt: Date.now(),
  };
}

type PanelProps = {
  className?: string;

  publishAsPortal?: boolean;

  acceptPortalMessages?: boolean;

  chatCompanyId?: string | null;
  /** Dossier lié — messages tagués pour la timeline du dossier. */
  chatInterventionId?: string | null;
  onRemoteClientMessage?: () => void;
};

export default function IvanaClientChatPanel({
  className,
  publishAsPortal = false,
  acceptPortalMessages = false,
  chatCompanyId = null,
  chatInterventionId = null,
  onRemoteClientMessage,
}: PanelProps) {
  const { t } = useTranslation();
  const { fields: staffFields } = useCrmStaffAccountPanel();
  const { profile: requesterProfile, clientAccountFields } = useRequesterHub();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<IvanaChatMessage[]>(() => [welcomeMessage(t)]);
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

  const storageKey = useMemo(() => `${STORAGE_PREFIX}:${user?.uid ?? "anonymous"}`, [user?.uid]);

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

    if (!CHAT_PERSISTENCE_ENABLED) {
      if (!cancelled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages([welcomeMessage(t)]);
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
      setMessages([welcomeMessage(t)]);
      hydratedRef.current = true;
    }
    return () => {
      cancelled = true;
    };
  }, [storageKey, firestoreSyncEnabled]);

  useEffect(() => {
    if (!hydratedRef.current || typeof window === "undefined" || firestoreSyncEnabled) return;
    if (!CHAT_PERSISTENCE_ENABLED) return;
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
            mapped.length === 0 && optimistic.length === 0 ? [welcomeMessage(t)] : mapped;
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

  const bubbleTestId = (m: IvanaChatMessage) => {
    if (m.role === "user") return "ivana-chat-bubble-user";
    if (m.role === "client") return "ivana-chat-bubble-client";
    if (m.role === "staff") return "ivana-chat-bubble-staff";
    return "ivana-chat-bubble-ivana";
  };

  const bubbleAlign = (m: IvanaChatMessage) =>
    m.role === "user" || m.role === "client" ? "justify-end" : "justify-start";

  const bubbleShellClass = (m: IvanaChatMessage) =>
    cn(
      "max-w-[92%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
      m.role === "user" || m.role === "client"
        ? "rounded-br-md bg-blue-600 text-white"
        : m.role === "staff"
          ? "rounded-bl-md border border-blue-200/90 bg-blue-50 text-slate-900"
          : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800",
      m.pending && "opacity-70",
      m.failed && "ring-1 ring-red-400/70"
    );

  const senderHeader = (m: IvanaChatMessage): string | null => {
    if (m.role === "client") return m.senderName?.trim() || t("chat.role_client");
    if (m.role === "staff") return m.senderName?.trim() || t("chat.role_staff");
    return null;
  };

  return (
    <div
      data-testid="ivana-client-chat-panel"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div
        ref={listRef}
        className={cn(
          GLASS_PANEL_BODY_SCROLL_COMPACT,
          "flex min-h-0 flex-1 flex-col gap-3 px-3 py-4"
        )}
      >
        {publishAsPortal && companyIdTrimmed && !portalAuthReady ? (
          <div
            data-testid="ivana-chat-login-hint"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900"
          >
            {t("chat.toast_login_description")}
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            data-testid={bubbleTestId(m)}
            className={cn("flex w-full", bubbleAlign(m))}
          >
            <div className={bubbleShellClass(m)}>
              {senderHeader(m) ? (
                <span
                  className={cn(
                    "mb-1 block text-[11px] font-semibold tracking-wide",
                    m.role === "client" ? "text-blue-100/90" : "text-blue-800/80"
                  )}
                >
                  {senderHeader(m)}
                </span>
              ) : null}
              {m.text}
              {m.failed ? (
                <span
                  className="ml-2 inline-block align-baseline text-[10px] font-semibold uppercase tracking-wide text-red-500"
                  data-testid="ivana-chat-bubble-failed"
                >
                  {t("chat.toast_send_failed")}
                </span>
              ) : null}
              {m.images && m.images.length > 0 ? (
                <div
                  className="mt-2 grid grid-cols-3 gap-1.5"
                  data-testid="ivana-chat-bubble-images"
                >
                  {m.images.map((url, idx) => (
                    <div
                      key={`${m.id}-img-${idx}`}
                      className={cn(
                        "aspect-square overflow-hidden rounded-[12px] bg-black/5",
                        m.role === "user" || m.role === "client"
                          ? "border border-white/40"
                          : "border border-black/10"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {ivanaTyping ? (
          <div className="flex justify-start" data-testid="ivana-chat-typing">
            <div className="rounded-[16px] rounded-bl-md border border-slate-200/80 bg-white px-4 py-3 text-[12px] font-medium text-slate-500 shadow-sm">
              {t("chat.typing")}
              <span className="inline-flex gap-0.5 pl-1">
                <span className="animate-pulse">·</span>
                <span className="animate-pulse [animation-delay:150ms]">·</span>
                <span className="animate-pulse [animation-delay:300ms]">·</span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-slate-200/80 bg-white/80 p-3 backdrop-blur-md">
        {pendingImages.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2" data-testid="ivana-chat-pending-images">
            {pendingImages.map((url, idx) => (
              <div
                key={`pending-${idx}`}
                className="group relative h-14 w-14 overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label={t("chat.remove_photo_aria")}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handlePickImages(e.target.files)}
          />
          <button
            type="button"
            data-testid="ivana-chat-attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachImagesBlocked}
            title={attachImagesBlocked ? t("chat.attach_blocked_title") : undefined}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              "text-slate-500 transition",
              attachImagesBlocked
                ? "cursor-not-allowed opacity-35"
                : "hover:bg-slate-900/5 hover:text-slate-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
              "active:scale-[0.98]"
            )}
            aria-label={t("chat.attach_aria")}
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <label htmlFor="ivana-chat-input" className="sr-only">
            {t("chat.input_label")}
          </label>
          <div className="flex min-w-0 flex-1 items-center rounded-[18px] border border-slate-200 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20">
            <textarea
              id="ivana-chat-input"
              data-testid="ivana-chat-input"
              rows={1}
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={t("chat.input_placeholder")}
              className="min-h-12 max-h-24 flex-1 resize-none overflow-y-auto bg-transparent px-4 py-3 text-[13px] leading-[18px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            data-testid="ivana-chat-send"
            onClick={() => void send()}
            disabled={(!draft.trim() && pendingImages.length === 0) || ivanaTyping}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20",
              "active:scale-[0.98]",
              (!draft.trim() && pendingImages.length === 0) || ivanaTyping
                ? "cursor-not-allowed text-slate-400 opacity-40"
                : "text-blue-600 hover:bg-blue-500/10 hover:text-blue-700"
            )}
            aria-label={t("chat.send_aria")}
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
