import type { Metadata } from "next";
import {
  PWA_ADMIN_SHORT_NAME,
  PWA_ADMIN_TITLE,
  PWA_MANIFEST_ADMIN,
  PWA_METADATA_ICONS,
} from "@/core/pwa/pwaSatelliteManifests";

export const metadata: Metadata = {
  title: PWA_ADMIN_TITLE,
  description: "Dispatcher et pilotage des interventions",
  applicationName: PWA_ADMIN_SHORT_NAME,
  manifest: PWA_MANIFEST_ADMIN,
  icons: PWA_METADATA_ICONS,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_ADMIN_SHORT_NAME,
  },
};

export default function AdminMobileLegacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
