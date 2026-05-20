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

  return (
    <div
      className={cn("mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2", className)}
      data-testid={testId}
    >
      {actions.map((action) => (
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
            "rounded-full px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-40",
            action.variant === "primary" &&
              "bg-indigo-600 text-white hover:bg-indigo-700",
            action.variant === "secondary" &&
              "border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
            (!action.variant || action.variant === "outline") &&
              "border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700",
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
