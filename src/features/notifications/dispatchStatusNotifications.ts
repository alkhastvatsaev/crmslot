import { logger } from "@/core/logger";
import { featureFlagsFromEnv } from "@/core/featureFlags";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { Intervention } from "@/features/interventions/types";
import { findApplicableRules } from "@/features/notifications/statusNotificationRules";

// ---------------------------------------------------------------------------
// Notification dispatcher — triggers email/SMS after status transitions
// ---------------------------------------------------------------------------

export interface NotificationPayload {
  channel: "email" | "sms" | "push" | "whatsapp";
  recipientRole: "client" | "technician" | "dispatcher";
  subjectKey: string;
  bodyKey: string;
  /** Variables de template pour interpolation côté API/Cloud Function. */
  variables: Record<string, string>;
}

export interface DispatchNotificationsParams {
  fromStatus: Intervention["status"];
  toStatus: Intervention["status"];
  intervention: Pick<
    Intervention,
    | "id"
    | "clientName"
    | "clientFirstName"
    | "clientLastName"
    | "clientPhone"
    | "address"
    | "title"
    | "scheduledDate"
    | "scheduledTime"
  >;
  /** Nom du technicien assigné (affiché dans les emails). */
  technicianName?: string;
}

/**
 * Construit la liste des notifications à envoyer suite à une transition de statut.
 * Cette fonction est pure (pas d'effets de bord) — l'envoi réel est délégué
 * à un Cloud Function ou à l'API `/api/notifications/send`.
 */
export function buildNotificationPayloads(
  params: DispatchNotificationsParams
): NotificationPayload[] {
  const { fromStatus, toStatus, intervention, technicianName } = params;
  const rules = findApplicableRules(fromStatus, toStatus);

  if (rules.length === 0) return [];

  const clientName =
    [intervention.clientFirstName, intervention.clientLastName].filter(Boolean).join(" ") ||
    intervention.clientName ||
    "Client";

  const variables: Record<string, string> = {
    clientName,
    interventionId: intervention.id,
    clientPhone: intervention.clientPhone || "",
    address: intervention.address || "",
    title: intervention.title || "",
    scheduledDate: intervention.scheduledDate || "",
    scheduledTime: intervention.scheduledTime || "",
    technicianName: technicianName || "",
    newStatus: toStatus,
    oldStatus: fromStatus,
  };

  const payloads: NotificationPayload[] = [];

  for (const rule of rules) {
    for (const target of rule.targets) {
      for (const channel of rule.channels) {
        payloads.push({
          channel,
          recipientRole: target,
          subjectKey: rule.subjectKey,
          bodyKey: rule.bodyKey,
          variables,
        });
      }
    }
  }

  return payloads;
}

/**
 * Envoie les notifications en appelant l'API interne.
 * En production, ce serait un Cloud Function Firestore trigger.
 * Ici on POST vers /api/notifications/send pour chaque payload.
 * Erreurs silencieuses (notifications ne doivent jamais bloquer le workflow).
 */
export async function dispatchStatusNotifications(
  params: DispatchNotificationsParams
): Promise<void> {
  const payloads = buildNotificationPayloads(params);
  if (payloads.length === 0) return;

  const whatsappEnabled = featureFlagsFromEnv().whatsappNotifications;

  // Fire-and-forget — ne jamais bloquer le workflow principal
  for (const payload of payloads) {
    try {
      if (payload.channel === "whatsapp") {
        const to = payload.variables.clientPhone;
        if (!whatsappEnabled || !to) continue;
        void fetchWithAuth("/api/notifications/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            interventionStatus: payload.variables.newStatus,
            address: payload.variables.address,
            clientName: payload.variables.clientName,
          }),
        });
        continue;
      }
      void fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently ignore — notification failures must never break the UX
      logger.warn("[notifications] Failed to dispatch:", { subjectKey: payload.subjectKey });
    }
  }
}
