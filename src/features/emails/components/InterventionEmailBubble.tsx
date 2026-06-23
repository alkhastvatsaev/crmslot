"use client";

import { useEffect } from "react";
import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInterventionEmailTime } from "@/features/emails/formatInterventionEmailTime";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";

type Props = {
  email: InterventionEmailDoc;
  onReply: (email: InterventionEmailDoc) => void;
  onMarkRead: (id: string) => void;
  replyLabel: string;
};

export default function InterventionEmailBubble({ email, onReply, onMarkRead, replyLabel }: Props) {
  const isOutbound = email.direction === "outbound";
  const isUnread = email.direction === "inbound" && !email.readAt;

  useEffect(() => {
    if (isUnread) onMarkRead(email.id);
  }, [isUnread, email.id, onMarkRead]);

  return (
    <div className={cn("flex flex-col gap-1", isOutbound ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-[18px] px-3.5 py-3 text-[13px] leading-relaxed shadow-sm",
          isOutbound
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
        )}
      >
        <p
          className={cn(
            "mb-1 text-[10px] font-bold uppercase tracking-wide",
            isOutbound ? "text-blue-200" : "text-slate-400"
          )}
        >
          {isOutbound ? `→ ${email.to}` : `← ${email.from}`}
        </p>
        <p className="font-semibold mb-0.5">{email.subject}</p>
        <p className="whitespace-pre-wrap">{email.bodyText}</p>
      </div>
      <div
        className={cn("flex items-center gap-2 px-1", isOutbound ? "flex-row-reverse" : "flex-row")}
      >
        <span className="text-[10px] text-slate-400">
          {formatInterventionEmailTime(email.createdAt)}
        </span>
        {!isOutbound && (
          <button
            type="button"
            data-testid={`email-reply-${email.id}`}
            onClick={() => onReply(email)}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Reply className="w-3 h-3" />
            {replyLabel}
          </button>
        )}
        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
      </div>
    </div>
  );
}
