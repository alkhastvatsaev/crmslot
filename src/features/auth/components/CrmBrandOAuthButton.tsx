"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "google" | "apple";

type Props = {
  variant: Variant;
  label: string;
  testId: string;
  disabled?: boolean;
  busy?: boolean;
  /** Icône seule — barre d’outils compacte (ex. /pricing). */
  compact?: boolean;
  onClick: () => void;
};

const labelFont: Record<Variant, string> = {
  google: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  apple: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
};

function GoogleLogo() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** Silhouette Apple officielle — blanc sur fond noir du bouton Sign in with Apple. */
function AppleLogo() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 814 1000"
      className="h-[18px] w-[15px] shrink-0 fill-white"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 129.9 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8-63.1 0-105.7-57.7-155.1-127.3-84.4-122.4-148.8-348.5-62.3-501.1 43.1-74.9 120.1-122.3 203.6-122.3 76.8 0 125.5 40.8 189.3 40.8 61.5 0 99.1-40.8 187.4-40.8 67.2 0 138.5 36.7 181.6 100.2-5.1 3.1-107.4 62.9-107.4 195.3-.1 148.7 126.5 200.5 129.9 201.8zM554.1 146.4c37.2-44.8 62.2-107.1 55.5-169.1-53.7 2.2-118.7 35.8-157.2 80.7-34.5 39.8-64.6 103.5-56.5 164.6 60.1 4.6 121.5-30.8 158.2-76.2z" />
    </svg>
  );
}

const variantStyles: Record<Variant, string> = {
  google: "border border-[#747775] bg-white text-[#1F1F1F] hover:bg-[#f8f9fa] active:bg-[#f1f3f4]",
  apple: "border border-black bg-black text-white hover:bg-neutral-900 active:bg-neutral-800",
};

/** Bouton OAuth CRM — logo fixe + libellé en vraie police système. */
export default function CrmBrandOAuthButton({
  variant,
  label,
  testId,
  disabled,
  busy,
  compact = false,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      data-testid={testId}
      data-oauth-variant={variant}
      data-oauth-compact={compact ? "true" : "false"}
      disabled={disabled || busy}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative flex items-center justify-center rounded-xl shadow-sm transition active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
        compact ? "h-10 w-10 shrink-0 px-0" : "h-11 w-full px-4",
        variantStyles[variant]
      )}
    >
      <span className="pointer-events-none flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        {busy ? (
          <Loader2
            className={cn(
              "h-4 w-4 animate-spin",
              variant === "apple" ? "text-white" : "text-slate-500"
            )}
            aria-hidden
          />
        ) : variant === "google" ? (
          <GoogleLogo />
        ) : (
          <AppleLogo />
        )}
      </span>
      {compact ? null : (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-12"
          aria-hidden
        >
          <span
            className="max-w-full truncate text-[14px] font-medium leading-tight antialiased"
            style={{ fontFamily: labelFont[variant] }}
          >
            {label}
          </span>
        </span>
      )}
    </button>
  );
}
