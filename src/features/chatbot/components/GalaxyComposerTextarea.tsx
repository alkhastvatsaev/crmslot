"use client";

import { useState, type KeyboardEvent, type RefObject } from "react";
import { cn } from "@/lib/utils";

type Props = {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  testId: string;
  ariaLabel: string;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
};

/**
 * Textarea Galaxy — texte centré ; curseur natif invisible si vide + centré,
 * donc barre clignotante factice au centre tant qu'il n'y a pas de saisie.
 */
export default function GalaxyComposerTextarea({
  inputRef,
  testId,
  ariaLabel,
  value,
  disabled = false,
  placeholder = "",
  onChange,
  onKeyDown,
  className,
}: Props) {
  const [focused, setFocused] = useState(false);
  const showFakeCaret = focused && !value && !disabled;

  return (
    <div className="chatbot-galaxy-composer-input-wrap">
      {showFakeCaret ? (
        <span
          className="chatbot-galaxy-composer-fake-caret"
          data-testid={`${testId}-fake-caret`}
          aria-hidden
        />
      ) : null}
      <textarea
        ref={inputRef}
        data-testid={testId}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={1}
        aria-label={ariaLabel}
        className={cn(
          "chatbot-galaxy-composer-input bg-transparent py-0 text-[15px] leading-snug focus:outline-none disabled:opacity-50",
          showFakeCaret && "chatbot-galaxy-composer-input--fake-caret",
          className
        )}
      />
    </div>
  );
}
