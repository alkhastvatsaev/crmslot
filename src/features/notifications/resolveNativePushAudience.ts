import type { FcmAudience } from "@/features/notifications/fcmWebPush";

/**
 * Audience FCM native selon l’URL chargée dans le shell Capacitor.
 * - `/m/demande` → client (clientPortalAuth)
 * - `/m/technician` → technicien (auth CRM)
 * - sinon (admin `/`) → backoffice (auth CRM)
 */
export function resolveNativePushAudience(pathname?: string): FcmAudience {
  const path = (pathname ?? "").trim();
  if (path.startsWith("/m/demande")) return "client";
  if (path.startsWith("/m/technician")) return "technician";
  return "backoffice";
}
