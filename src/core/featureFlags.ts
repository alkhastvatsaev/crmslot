/**
 * Feature flags — env (`NEXT_PUBLIC_FF_*`) + overrides Firestore `companies/{id}/featureFlags`.
 */
export type BelgmapFeatureFlags = {
  unifiedFieldCockpit: boolean;
  crmContacts: boolean;
  lecotProductSearch: boolean;
  commissionsV2: boolean;
  interventionCommandPalette: boolean;
  /** Lot PWA v2 : CRM→BO, checklist, KPI, relances, devis PDF, SAV, etc. */
  pwaV2Bundle: boolean;
  /** Devis / quotations — créer et envoyer des devis avant facturation. */
  quotesEnabled: boolean;
  /** Contrats de maintenance récurrents avec génération auto d'interventions. */
  maintenanceContracts: boolean;
  /** Suivi SLA par priorité (low/medium/high/urgent). */
  slaTracker: boolean;
  /** Géofencing auto — changement de statut à l'arrivée sur site. */
  geofenceAuto: boolean;
  /** Gestion du stock véhicule par technicien. */
  vehicleStock: boolean;
  /** Notifications WhatsApp / SMS via Twilio. */
  whatsappNotifications: boolean;
  /** Portail fournisseur — commandes directes Lecot. */
  supplierPortal: boolean;
  /** Parc matériel client — inventaire équipements par client/site. */
  equipmentInventory: boolean;
  /** Facturation électronique Peppol / UBL (obligation BE 2026). */
  peppolEInvoicing: boolean;
  /** Planning multi-techniciens (colonnes par tech). */
  multiTechSchedule: boolean;
  /** Webhooks sortants (HMAC) sur transitions métier. */
  outboundWebhooks: boolean;
  /** Signature électronique à distance via portail client. */
  remoteESign: boolean;
  /** Rapports BI + analytics PostHog. */
  analyticsReports: boolean;
};

export const DEFAULT_FEATURE_FLAGS: BelgmapFeatureFlags = {
  unifiedFieldCockpit: true,
  crmContacts: false,
  lecotProductSearch: true,
  commissionsV2: true,
  interventionCommandPalette: true,
  pwaV2Bundle: true,
  quotesEnabled: true,
  maintenanceContracts: true,
  slaTracker: true,
  geofenceAuto: false,
  vehicleStock: true,
  whatsappNotifications: true,
  supplierPortal: true,
  equipmentInventory: true,
  peppolEInvoicing: true,
  multiTechSchedule: true,
  outboundWebhooks: true,
  remoteESign: true,
  analyticsReports: true,
};

function readEnvBool(key: string, fallback: boolean): boolean {
  if (typeof process === "undefined") return fallback;
  const raw = process.env[key]?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

/** Flags from build-time env (Vercel / .env.local). */
export function featureFlagsFromEnv(): BelgmapFeatureFlags {
  return {
    unifiedFieldCockpit: readEnvBool(
      "NEXT_PUBLIC_FF_UNIFIED_FIELD_COCKPIT",
      DEFAULT_FEATURE_FLAGS.unifiedFieldCockpit
    ),
    crmContacts: readEnvBool("NEXT_PUBLIC_FF_CRM_CONTACTS", DEFAULT_FEATURE_FLAGS.crmContacts),
    lecotProductSearch: readEnvBool(
      "NEXT_PUBLIC_FF_LECOT_PRODUCT_SEARCH",
      DEFAULT_FEATURE_FLAGS.lecotProductSearch
    ),
    commissionsV2: readEnvBool(
      "NEXT_PUBLIC_FF_COMMISSIONS_V2",
      DEFAULT_FEATURE_FLAGS.commissionsV2
    ),
    interventionCommandPalette: readEnvBool(
      "NEXT_PUBLIC_FF_INTERVENTION_COMMAND_PALETTE",
      DEFAULT_FEATURE_FLAGS.interventionCommandPalette
    ),
    pwaV2Bundle: readEnvBool("NEXT_PUBLIC_FF_PWA_V2", DEFAULT_FEATURE_FLAGS.pwaV2Bundle),
    quotesEnabled: readEnvBool("NEXT_PUBLIC_FF_QUOTES", DEFAULT_FEATURE_FLAGS.quotesEnabled),
    maintenanceContracts: readEnvBool(
      "NEXT_PUBLIC_FF_MAINTENANCE",
      DEFAULT_FEATURE_FLAGS.maintenanceContracts
    ),
    slaTracker: readEnvBool("NEXT_PUBLIC_FF_SLA", DEFAULT_FEATURE_FLAGS.slaTracker),
    geofenceAuto: readEnvBool("NEXT_PUBLIC_FF_GEOFENCE", DEFAULT_FEATURE_FLAGS.geofenceAuto),
    vehicleStock: readEnvBool("NEXT_PUBLIC_FF_VEHICLE_STOCK", DEFAULT_FEATURE_FLAGS.vehicleStock),
    whatsappNotifications: readEnvBool(
      "NEXT_PUBLIC_FF_WHATSAPP",
      DEFAULT_FEATURE_FLAGS.whatsappNotifications
    ),
    supplierPortal: readEnvBool(
      "NEXT_PUBLIC_FF_SUPPLIER_PORTAL",
      DEFAULT_FEATURE_FLAGS.supplierPortal
    ),
    equipmentInventory: readEnvBool(
      "NEXT_PUBLIC_FF_EQUIPMENT_INVENTORY",
      DEFAULT_FEATURE_FLAGS.equipmentInventory
    ),
    peppolEInvoicing: readEnvBool("NEXT_PUBLIC_FF_PEPPOL", DEFAULT_FEATURE_FLAGS.peppolEInvoicing),
    multiTechSchedule: readEnvBool(
      "NEXT_PUBLIC_FF_MULTI_TECH_SCHEDULE",
      DEFAULT_FEATURE_FLAGS.multiTechSchedule
    ),
    outboundWebhooks: readEnvBool(
      "NEXT_PUBLIC_FF_OUTBOUND_WEBHOOKS",
      DEFAULT_FEATURE_FLAGS.outboundWebhooks
    ),
    remoteESign: readEnvBool("NEXT_PUBLIC_FF_REMOTE_ESIGN", DEFAULT_FEATURE_FLAGS.remoteESign),
    analyticsReports: readEnvBool(
      "NEXT_PUBLIC_FF_ANALYTICS",
      DEFAULT_FEATURE_FLAGS.analyticsReports
    ),
  };
}

export function mergeFeatureFlags(
  base: BelgmapFeatureFlags,
  partial?: Partial<BelgmapFeatureFlags> | null
): BelgmapFeatureFlags {
  if (!partial) return base;
  return { ...base, ...partial };
}
