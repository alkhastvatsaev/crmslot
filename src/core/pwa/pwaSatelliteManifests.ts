import type { Metadata } from "next";

/** Manifests PWA distincts — une icône écran d'accueil par rôle (admin / client / technicien). */

export const PWA_THEME_COLOR = "#09090B";

/** Même rendu écran d'accueil Android/iOS pour admin, demande et terrain. */
export const PWA_METADATA_ICONS: NonNullable<Metadata["icons"]> = {
  icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
};

/** Entrées `icons` partagées par tous les manifest.json statiques (`public/`). */
export const PWA_MANIFEST_ICONS = [
  { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  {
    src: "/icon-maskable-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
  { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
] as const;

export const PWA_MANIFEST_ADMIN = "/manifest.json";
export const PWA_MANIFEST_ADMIN_MOBILE = "/manifest-admin-mobile.json";
export const PWA_MANIFEST_DEMANDE = "/manifest-demande.json";
export const PWA_MANIFEST_TECHNICIAN = "/manifest-technician.json";

export const PWA_ADMIN_TITLE = "CRMSLOT Admin";
export const PWA_ADMIN_MOBILE_TITLE = "CRMSLOT Inbox";
export const PWA_DEMANDE_TITLE = "CRMSLOT Demande";
export const PWA_TECHNICIAN_TITLE = "CRMSLOT Terrain";

export const PWA_ADMIN_SHORT_NAME = "Admin";
export const PWA_ADMIN_MOBILE_SHORT_NAME = "Inbox";
export const PWA_DEMANDE_SHORT_NAME = "Demande";
export const PWA_TECHNICIAN_SHORT_NAME = "Terrain";
