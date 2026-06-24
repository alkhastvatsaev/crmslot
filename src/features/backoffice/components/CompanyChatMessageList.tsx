"use client";

import type { RefObject } from "react";
import { cn } from "@/lib/utils";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  type CompanyChatMessage,
  companyChatBubbleTestId,
  companyChatBubbleAlign,
  companyChatSenderHeader,
} from "@/features/backoffice/companyChatTypes";

type CompanyChatMessageListProps = {
  className?: string;
  messages: CompanyChatMessage[];
  assistantTyping: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  publishAsPortal: boolean;
  companyIdTrimmed: string;
  portalAuthReady: boolean;
  portalProfileErrorKey?: string | null;
  portalProfileReady?: boolean;
};

function bubbleShellClass(m: CompanyChatMessage) {
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

export default function CompanyChatMessageList({
  className,
  messages,
  assistantTyping,
  listRef,
  publishAsPortal,
  companyIdTrimmed,
  portalAuthReady,
  portalProfileErrorKey,
  portalProfileReady = true,
}: CompanyChatMessageListProps) {
  const { t } = useTranslation();

  return (
    <div
      ref={listRef}
      data-testid="company-chat-messages"
      className={cn(
        GLASS_PANEL_BODY_SCROLL_COMPACT,
        "overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        {publishAsPortal && portalProfileErrorKey ? (
          <div
            data-testid="company-chat-profile-error"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-medium text-red-900"
          >
            {t(portalProfileErrorKey)}
          </div>
        ) : null}
        {publishAsPortal && companyIdTrimmed && !portalAuthReady && !portalProfileErrorKey ? (
          <div
            data-testid="company-chat-login-hint"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900"
          >
            {t("chat.connecting")}
          </div>
        ) : null}
        {publishAsPortal &&
        companyIdTrimmed &&
        portalAuthReady &&
        !portalProfileReady &&
        !portalProfileErrorKey ? (
          <div
            data-testid="company-chat-profile-loading"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900"
          >
            {t("chat.connecting")}
          </div>
        ) : null}
        {publishAsPortal && !companyIdTrimmed ? (
          <div
            data-testid="company-chat-company-hint"
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-900"
          >
            {t("chat.company_unconfigured")}
          </div>
        ) : null}
        {messages.map((m) => {
          const header = companyChatSenderHeader(m, t);
          return (
            <div
              key={m.id}
              data-testid={companyChatBubbleTestId(m)}
              className={cn("flex w-full", companyChatBubbleAlign(m))}
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
                    data-testid="company-chat-bubble-failed"
                  >
                    {t("chat.toast_send_failed")}
                  </span>
                ) : null}
                {m.images && m.images.length > 0 ? (
                  <div
                    className="mt-2 grid grid-cols-3 gap-1.5"
                    data-testid="company-chat-bubble-images"
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
        {assistantTyping ? (
          <div className="flex justify-start" data-testid="company-chat-typing">
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
    </div>
  );
}
