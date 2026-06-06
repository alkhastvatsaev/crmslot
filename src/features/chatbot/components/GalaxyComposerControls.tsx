"use client";

import { ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type NewButtonProps = {
  ariaLabel: string;
  testId: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
};

type SendButtonProps = {
  ariaLabel: string;
  testId: string;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
};

/** Nouvelle conversation — cercle verre + « + ». */
export function GalaxyComposerNewButton({ ariaLabel, testId, onClick, className }: NewButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "chatbot-galaxy-composer-action chatbot-galaxy-composer-action--new",
        className
      )}
    >
      <Plus className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden />
    </button>
  );
}

/** Envoi — cercle verre avec flèche fine. */
export function GalaxyComposerSendButton({
  ariaLabel,
  testId,
  disabled = false,
  onClick,
  className,
}: SendButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "chatbot-galaxy-composer-action chatbot-galaxy-composer-action--send",
        disabled && "chatbot-galaxy-composer-action--muted",
        className
      )}
    >
      <ArrowRight className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
