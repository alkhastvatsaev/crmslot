"use client";

import { cn } from "@/lib/utils";
import type { ChatbotQuickAction } from "@/features/chatbot/chatbot-quick-actions";

type Props = {
  actions: ChatbotQuickAction[];
  disabled?: boolean;
  onSendMessage: (text: string) => void;
  className?: string;
  "data-testid"?: string;
};

export default function ChatbotQuickActions({
  actions,
  disabled,
  onSendMessage,
  className,
  "data-testid": testId = "chatbot-quick-actions",
}: Props) {
  if (actions.length === 0) return null;

  const orderActions = actions.filter((a) => a.variant === "primary" || a.variant === "secondary");
  const utilityActions = actions.filter((a) => !a.variant || a.variant === "outline");

  return (
    <div
      className={cn("mt-2.5 flex flex-col gap-1.5 border-t border-slate-100 pt-2.5", className)}
      data-testid={testId}
    >
      {orderActions.length > 0 && (
        <div className="flex flex-col gap-1">
          {orderActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              data-testid={`chatbot-quick-action-${action.id}`}
              onClick={() => {
                if (action.kind === "open_url") {
                  window.open(action.payload, "_blank", "noopener,noreferrer");
                  return;
                }
                onSendMessage(action.payload);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-[12px] font-medium transition-all disabled:opacity-40",
                action.variant === "primary"
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700"
                  : "border border-zinc-200/80 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              )}
            >
              <span className="min-w-0 leading-snug">{action.label}</span>
              {action.meta && (
                <span
                  className={cn(
                    "shrink-0 tabular-nums text-[11px]",
                    action.variant === "primary" ? "text-white/50" : "text-zinc-400"
                  )}
                >
                  {action.meta}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {utilityActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {utilityActions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              data-testid={`chatbot-quick-action-${action.id}`}
              onClick={() => {
                if (action.kind === "open_url") {
                  window.open(action.payload, "_blank", "noopener,noreferrer");
                  return;
                }
                onSendMessage(action.payload);
              }}
              className="rounded-lg border border-slate-200/80 bg-white/60 px-2.5 py-1 text-[11px] text-slate-600 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 disabled:opacity-40"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
