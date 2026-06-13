"use client";

import type { MouseEvent, RefObject } from "react";
import { ArrowRight, Plus, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Clic sur la barre Galaxy → focus textarea (curseur visible). */
export function galaxyComposerFieldMouseDown(
  e: MouseEvent,
  inputRef: RefObject<HTMLTextAreaElement | null>,
  disabled: boolean
) {
  if (disabled) return;
  const target = e.target as HTMLElement;
  if (target.closest("button")) return;
  if (target === inputRef.current) return;
  e.preventDefault();
  const el = inputRef.current;
  if (!el) return;
  el.focus();
  const pos = el.value.length;
  try {
    el.setSelectionRange(pos, pos);
  } catch {
    // setSelectionRange peut échouer si le champ est encore disabled
  }
}

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

type MicButtonProps = {
  ariaLabel: string;
  testId: string;
  listening: boolean;
  disabled?: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
};

/** Micro — cercle verre, rouge pulsant quand actif. */
export function GalaxyComposerMicButton({
  ariaLabel,
  testId,
  listening,
  disabled = false,
  onClick,
  className,
}: MicButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={listening}
      className={cn(
        "chatbot-galaxy-composer-action",
        listening
          ? "chatbot-galaxy-composer-action--mic-active animate-pulse"
          : "chatbot-galaxy-composer-action--new",
        disabled && "chatbot-galaxy-composer-action--muted",
        className
      )}
    >
      {listening ? (
        <MicOff className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden />
      ) : (
        <Mic className="h-[17px] w-[17px]" strokeWidth={1.5} aria-hidden />
      )}
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
