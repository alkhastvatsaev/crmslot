import { Suspense } from "react";
import type { Metadata } from "next";
import TechnicianMobileApp from "@/features/interventions/components/TechnicianMobileApp";

export const metadata: Metadata = {
  title: "CRMSLOT Terrain",
  description: "Missions et clôture technicien",
};

export default function TechnicianMobileRoutePage() {
  return (
    <Suspense
      fallback={
        <div
          data-testid="technician-mobile-route-loading"
          className="flex min-h-dvh items-center justify-center bg-slate-50"
          aria-busy="true"
        />
      }
    >
      <TechnicianMobileApp />
    </Suspense>
  );
}
