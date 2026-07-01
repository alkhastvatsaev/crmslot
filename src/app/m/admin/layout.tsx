import type { Metadata } from "next";
import {
  PWA_ADMIN_MOBILE_METADATA_ICONS,
  PWA_ADMIN_MOBILE_SHORT_NAME,
  PWA_ADMIN_MOBILE_TITLE,
  PWA_MANIFEST_ADMIN_MOBILE,
} from "@/core/pwa/pwaSatelliteManifests";

export const metadata: Metadata = {
  title: PWA_ADMIN_MOBILE_TITLE,
  description: "Inbox et missions du jour",
  applicationName: PWA_ADMIN_MOBILE_SHORT_NAME,
  manifest: PWA_MANIFEST_ADMIN_MOBILE,
  icons: PWA_ADMIN_MOBILE_METADATA_ICONS,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_ADMIN_MOBILE_SHORT_NAME,
  },
};

export default function AdminMobileLegacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
