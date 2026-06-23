"use client";

import { Building2 } from "lucide-react";

export default function BackOfficeDashboardGate() {
  return (
    <div
      data-testid="back-office-gate"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit] px-4 py-6"
    >
      <div
        className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2 rounded-[16px] border border-amber-200/50 bg-amber-50/80 px-4 py-5 text-[13px] shadow-[0_14px_36px_-18px_rgba(15,23,42,0.12)]"
        aria-labelledby="backoffice-gate-title"
      >
        <p id="backoffice-gate-title" className="sr-only">
          Invitation société requise pour le tableau des interventions.
        </p>
        <Building2 className="h-14 w-14 text-amber-700" aria-hidden />
      </div>
    </div>
  );
}
