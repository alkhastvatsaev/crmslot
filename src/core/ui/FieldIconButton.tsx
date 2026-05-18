"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ReactNode;
  label: string;
  href?: string;
  testId?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const baseClass =
  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-900 transition active:scale-95 hover:bg-white disabled:pointer-events-none disabled:opacity-40";

/** Cible tactile 56px — icône seule, label en aria. */
export default function FieldIconButton({
  icon,
  label,
  href,
  testId,
  disabled,
  onClick,
  className,
}: Props) {
  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        data-testid={testId}
        aria-label={label}
        className={cn(baseClass, className)}
      >
        {icon}
      </a>
    );
  }

  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(baseClass, className)}
    >
      {icon}
    </button>
  );
}

export function FieldIconButtonRow({
  children,
  className,
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className={cn("flex items-center justify-center gap-3", className)}>
      {children}
    </div>
  );
}
