import { Suspense } from "react";
import type { Metadata } from "next";
import AppBootLoadingScreen from "@/core/ui/AppBootLoadingScreen";
import { ClientMobileApp } from "@/features/company";

export const metadata: Metadata = {
  title: "CRMSLOT Demande",
  description: "Formulaire et suivi client",
};

export default function ClientMobileRoutePage() {
  return (
    <Suspense fallback={<AppBootLoadingScreen testId="client-mobile-route-loading" />}>
      <ClientMobileApp />
    </Suspense>
  );
}
