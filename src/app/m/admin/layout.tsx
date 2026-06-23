import type { Metadata } from "next";
import {
  PWA_ADMIN_SHORT_NAME,
  PWA_ADMIN_TITLE,
  PWA_MANIFEST_ADMIN,
} from "@/core/pwa/pwaSatelliteManifests";

export const metadata: Metadata = {
  title: PWA_ADMIN_TITLE,
  description: "Inbox et missions du jour",
  applicationName: PWA_ADMIN_SHORT_NAME,
  manifest: PWA_MANIFEST_ADMIN,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_ADMIN_SHORT_NAME,
  },
};

export default function AdminMobilePwaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
