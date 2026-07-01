import type { Metadata } from "next";

/**
 * Manifests PWA distincts — une icône écran d'accueil par rôle (admin / client / technicien).
 * Contenu JSON : `pwaManifestDefinitions.ts` → `npm run sync:pwa-manifests` → `public/manifest*.json`.
 * Scopes satellites (`/m/demande`, `/m/technician`) + `id` opaques obligatoires pour des installs Android séparées.
 */

export const PWA_THEME_COLOR = "#09090B";

export type PwaSurfaceKey = "admin" | "inbox" | "demande" | "technician";

type PwaManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
};

function buildPwaManifestIcons(surface: PwaSurfaceKey): readonly PwaManifestIcon[] {
  return [
    {
      src: `/pwa/icon-${surface}-192.png`,
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `/pwa/icon-${surface}-512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: `/pwa/icon-${surface}-maskable-512.png`,
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: `/pwa/icon-${surface}.svg`,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any",
    },
  ];
}

function buildPwaMetadataIcons(surface: PwaSurfaceKey): NonNullable<Metadata["icons"]> {
  return {
    icon: [{ url: `/pwa/icon-${surface}.svg`, type: "image/svg+xml" }],
    apple: [{ url: `/pwa/icon-${surface}-192.png`, sizes: "192x192", type: "image/png" }],
  };
}

/** Admin desktop (`/`). */
export const PWA_METADATA_ICONS = buildPwaMetadataIcons("admin");
export const PWA_MANIFEST_ICONS = buildPwaManifestIcons("admin");

export const PWA_ADMIN_MOBILE_METADATA_ICONS = buildPwaMetadataIcons("inbox");
export const PWA_ADMIN_MOBILE_MANIFEST_ICONS = buildPwaManifestIcons("inbox");

export const PWA_DEMANDE_METADATA_ICONS = buildPwaMetadataIcons("demande");
export const PWA_DEMANDE_MANIFEST_ICONS = buildPwaManifestIcons("demande");

export const PWA_TECHNICIAN_METADATA_ICONS = buildPwaMetadataIcons("technician");
export const PWA_TECHNICIAN_MANIFEST_ICONS = buildPwaManifestIcons("technician");

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
