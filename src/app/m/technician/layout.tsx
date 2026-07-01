import type { Metadata } from "next";
import {
  PWA_MANIFEST_TECHNICIAN,
  PWA_TECHNICIAN_METADATA_ICONS,
  PWA_TECHNICIAN_SHORT_NAME,
  PWA_TECHNICIAN_TITLE,
} from "@/core/pwa/pwaSatelliteManifests";

export const metadata: Metadata = {
  title: PWA_TECHNICIAN_TITLE,
  description: "Missions et clôture technicien",
  applicationName: PWA_TECHNICIAN_SHORT_NAME,
  manifest: PWA_MANIFEST_TECHNICIAN,
  icons: PWA_TECHNICIAN_METADATA_ICONS,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_TECHNICIAN_SHORT_NAME,
  },
};

export default function TechnicianMobilePwaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
