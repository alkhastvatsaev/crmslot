import type { Metadata, Viewport } from "next";
import {
  PWA_DEMANDE_METADATA_ICONS,
  PWA_DEMANDE_SHORT_NAME,
  PWA_DEMANDE_TITLE,
  PWA_MANIFEST_DEMANDE,
  PWA_THEME_COLOR,
} from "@/core/pwa/pwaSatelliteManifests";

export const metadata: Metadata = {
  title: PWA_DEMANDE_TITLE,
  description: "Formulaire et suivi client",
  applicationName: PWA_DEMANDE_SHORT_NAME,
  manifest: PWA_MANIFEST_DEMANDE,
  icons: PWA_DEMANDE_METADATA_ICONS,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_DEMANDE_SHORT_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
};

export default function ClientMobilePwaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
