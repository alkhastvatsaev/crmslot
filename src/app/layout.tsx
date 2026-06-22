import type { Metadata, Viewport } from "next";
import { Outfit, Geist } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/core/i18n/I18nContext";
import {
  PWA_ADMIN_SHORT_NAME,
  PWA_ADMIN_TITLE,
  PWA_MANIFEST_ADMIN,
} from "@/core/pwa/pwaSatelliteManifests";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

const appGitSha = process.env.NEXT_PUBLIC_APP_GIT_SHA ?? "";

export const metadata: Metadata = {
  title: PWA_ADMIN_TITLE,
  description: "Back-office et pilotage des interventions",
  applicationName: PWA_ADMIN_SHORT_NAME,
  manifest: PWA_MANIFEST_ADMIN,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: PWA_ADMIN_SHORT_NAME,
  },
  other: {
    google: "notranslate",
    ...(appGitSha ? { "application-git-sha": appGitSha } : {}),
  },
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import NativeShellBootstrap from "@/core/native/NativeShellBootstrap";
import DeferredRootBootstraps from "@/core/native/DeferredRootBootstraps";
import PwaStaleBundleGuard from "@/core/pwa/PwaStaleBundleGuard";
import LivePerfProbeRoot from "@/core/perf/LivePerfProbeRoot";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      translate="no"
      className={cn("notranslate", outfit.variable, geist.variable)}
      suppressHydrationWarning
    >
      <body className="notranslate" suppressHydrationWarning>
        <NativeShellBootstrap />
        <PwaStaleBundleGuard />
        <LivePerfProbeRoot />
        <DeferredRootBootstraps />
        <I18nProvider>{children}</I18nProvider>
        <Toaster position="top-center" theme="light" richColors closeButton />
      </body>
    </html>
  );
}
