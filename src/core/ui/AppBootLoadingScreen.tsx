"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  testId?: string;
  className?: string;
  /** `fixed` = overlay plein écran (auth) · `inline` = écran boot classique */
  variant?: "fixed" | "inline";
};

/** Spinner bleu unique au démarrage de l'app (auth, détection mobile, redirection satellite). */
export default function AppBootLoadingScreen({ testId, className, variant = "inline" }: Props) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex items-center justify-center bg-slate-50",
        variant === "fixed" ? "fixed inset-0 z-[9999]" : "min-h-dvh",
        className
      )}
      aria-busy="true"
    >
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" strokeWidth={1.5} aria-hidden />
    </div>
  );
}
