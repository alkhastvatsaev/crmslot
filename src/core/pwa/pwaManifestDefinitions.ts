import {
  PWA_ADMIN_MOBILE_SHORT_NAME,
  PWA_ADMIN_MOBILE_TITLE,
  PWA_ADMIN_SHORT_NAME,
  PWA_ADMIN_TITLE,
  PWA_DEMANDE_SHORT_NAME,
  PWA_DEMANDE_TITLE,
  PWA_MANIFEST_ICONS,
  PWA_TECHNICIAN_SHORT_NAME,
  PWA_TECHNICIAN_TITLE,
  PWA_THEME_COLOR,
} from "@/core/pwa/pwaSatelliteManifests";

export type PwaManifestDefinition = {
  filename: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  id: string;
};

/** Manifests statiques (`public/manifest*.json`) — source unique pour éviter les dérives. */
export const PWA_MANIFEST_DEFINITIONS = [
  {
    filename: "manifest.json",
    name: PWA_ADMIN_TITLE,
    short_name: PWA_ADMIN_SHORT_NAME,
    description: "Dispatcher et pilotage CRMSLOT",
    start_url: "/",
    scope: "/",
    id: "/",
  },
  {
    filename: "manifest-admin-mobile.json",
    name: PWA_ADMIN_MOBILE_TITLE,
    short_name: PWA_ADMIN_MOBILE_SHORT_NAME,
    description: "Inbox et missions du jour CRMSLOT",
    start_url: "/m/admin",
    scope: "/m/admin",
    id: "/m/admin",
  },
  {
    filename: "manifest-demande.json",
    name: PWA_DEMANDE_TITLE,
    short_name: PWA_DEMANDE_SHORT_NAME,
    description: "Formulaire et suivi client CRMSLOT",
    start_url: "/m/demande",
    scope: "/m/demande",
    id: "/m/demande",
  },
  {
    filename: "manifest-technician.json",
    name: PWA_TECHNICIAN_TITLE,
    short_name: PWA_TECHNICIAN_SHORT_NAME,
    description: "Missions et clôture technicien CRMSLOT",
    start_url: "/m/technician",
    scope: "/m/technician",
    id: "/m/technician",
  },
] as const satisfies readonly PwaManifestDefinition[];

export function buildPwaManifestJson(definition: PwaManifestDefinition): string {
  return `${JSON.stringify(
    {
      name: definition.name,
      short_name: definition.short_name,
      description: definition.description,
      start_url: definition.start_url,
      scope: definition.scope,
      display: "standalone",
      orientation: "portrait-primary",
      lang: "fr",
      dir: "ltr",
      id: definition.id,
      background_color: PWA_THEME_COLOR,
      theme_color: PWA_THEME_COLOR,
      icons: PWA_MANIFEST_ICONS.map((icon) => ({ ...icon })),
    },
    null,
    2
  )}\n`;
}
