"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  type IvanaChatMessage,
  ivanaBubbleTestId,
  ivanaBubbleAlign,
  ivanaSenderHeader,
} from "@/features/backoffice/ivanaChatTypes";

type IvanaChatMessageListProps = {
  messages: IvanaChatMessage[];
  ivanaTyping: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  publishAsPortal: boolean;
  companyIdTrimmed: string;
  portalAuthReady: boolean;
};

function bubbleShellClass(m: IvanaChatMessage) {
  return cn(
    "max-w-[92%] rounded-[16px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
    m.role === "user" || m.role === "client"
      ? "rounded-br-md bg-blue-600 text-white"
      : m.role === "staff"
        ? "rounded-bl-md border border-blue-200/90 bg-blue-50 text-slate-900"
        : "rounded-bl-md border border-slate-200/80 bg-white text-slate-800",
    m.pending && "opacity-70",
    m.failed && "ring-1 ring-red-400/70"
  );
}

export default function IvanaChatMessageList({
  messages,
  ivanaTyping,
  listRef,
  publishAsPortal,
  companyIdTrimmed,
  portalAuthReady,
}: IvanaChatMessageListProps) {
  const { t } = useTranslation();

  return (
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
      {messages.map((m) => {
        const header = ivanaSenderHeader(m, t);
        return (
          <div
            key={m.id}
            data-testid={ivanaBubbleTestId(m)}
            className={cn("flex w-full", ivanaBubbleAlign(m))}
          >
            <div className={bubbleShellClass(m)}>
              {header ? (
                <span
                  className={cn(
                    "mb-1 block text-[11px] font-semibold tracking-wide",
                    m.role === "client" ? "text-blue-100/90" : "text-blue-800/80"
                  )}
                >
                  {header}
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
        );
      })}
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
  );
}
