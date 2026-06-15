import type { Metadata } from "next";
import TechnicianMobileApp from "@/features/interventions/components/TechnicianMobileApp";

export const metadata: Metadata = {
  title: "CRMSLOT Terrain",
  description: "Missions et clôture technicien",
};

export default function TechnicianMobileRoutePage() {
  return <TechnicianMobileApp />;
}
