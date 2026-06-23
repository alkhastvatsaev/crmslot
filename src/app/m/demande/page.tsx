import { Suspense } from "react";
import type { Metadata } from "next";
import { ClientMobileApp } from "@/features/company";

export const metadata: Metadata = {
  title: "CRMSLOT Demande",
  description: "Formulaire et suivi client",
};

export default function ClientMobileRoutePage() {
  return (
    <Suspense
      fallback={
        <div
          data-testid="client-mobile-route-loading"
          className="flex min-h-dvh items-center justify-center bg-slate-50"
          aria-busy="true"
        />
      }
    >
      <ClientMobileApp />
    </Suspense>
  );
}
