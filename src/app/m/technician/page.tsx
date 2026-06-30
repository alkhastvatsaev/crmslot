import { Suspense } from "react";
import type { Metadata } from "next";
import AppBootLoadingScreen from "@/core/ui/AppBootLoadingScreen";
import TechnicianMobileApp from "@/features/interventions/components/TechnicianMobileApp";

export const metadata: Metadata = {
  title: "CRMSLOT Terrain",
  description: "Missions et clôture technicien",
};

export default function TechnicianMobileRoutePage() {
  return (
    <Suspense fallback={<AppBootLoadingScreen testId="technician-mobile-route-loading" />}>
      <TechnicianMobileApp />
    </Suspense>
  );
}
