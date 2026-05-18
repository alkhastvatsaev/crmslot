import type { Intervention } from "@/features/interventions/types";

// ---------------------------------------------------------------------------
// Status-based email notification rules
// ---------------------------------------------------------------------------

export type NotificationChannel = "email" | "sms" | "push";

export interface StatusNotificationRule {
  /** Transition déclencheur. "*" = tout fromStatus. */
  fromStatus: Intervention["status"] | "*";
  toStatus: Intervention["status"];
  /** Destinataires calculés. */
  targets: ("client" | "technician" | "dispatcher")[];
  channels: NotificationChannel[];
  /** Clé i18n du sujet de l'email. */
  subjectKey: string;
  /** Clé i18n du body. */
  bodyKey: string;
}

/**
 * Règles de notification par changement de statut.
 * Le dispatcher back-office est notifié par inbox alert (Firestore) ; ici on gère
 * uniquement les notifications email/SMS sortantes vers client et technicien.
 */
export const STATUS_NOTIFICATION_RULES: StatusNotificationRule[] = [
  // Client notifié quand technicien assigné
  {
    fromStatus: "*",
    toStatus: "assigned",
    targets: ["client"],
    channels: ["email"],
    subjectKey: "notifications.email.assigned.subject",
    bodyKey: "notifications.email.assigned.body",
  },
  // Technicien notifié par Push quand assigné
  {
    fromStatus: "*",
    toStatus: "assigned",
    targets: ["technician"],
    channels: ["push"],
    subjectKey: "notifications.push.assigned.subject",
    bodyKey: "notifications.push.assigned.body",
  },
  // Client notifié quand technicien en route
  {
    fromStatus: "assigned",
    toStatus: "en_route",
    targets: ["client"],
    channels: ["email"],
    subjectKey: "notifications.email.en_route.subject",
    bodyKey: "notifications.email.en_route.body",
  },
  // Client notifié quand intervention terminée
  {
    fromStatus: "in_progress",
    toStatus: "done",
    targets: ["client"],
    channels: ["email"],
    subjectKey: "notifications.email.done.subject",
    bodyKey: "notifications.email.done.body",
  },
  // Client notifié quand facture générée
  {
    fromStatus: "done",
    toStatus: "invoiced",
    targets: ["client"],
    channels: ["email"],
    subjectKey: "notifications.email.invoiced.subject",
    bodyKey: "notifications.email.invoiced.body",
  },
  // Client + technicien notifiés quand matériel en attente
  {
    fromStatus: "in_progress",
    toStatus: "waiting_material",
    targets: ["client", "dispatcher"],
    channels: ["email"],
    subjectKey: "notifications.email.waiting_material.subject",
    bodyKey: "notifications.email.waiting_material.body",
  },
  // Client notifié si annulation
  {
    fromStatus: "*",
    toStatus: "cancelled",
    targets: ["client"],
    channels: ["email"],
    subjectKey: "notifications.email.cancelled.subject",
    bodyKey: "notifications.email.cancelled.body",
  },
];

/**
 * Trouve les règles applicables pour une transition donnée.
 */
export function findApplicableRules(
  fromStatus: Intervention["status"],
  toStatus: Intervention["status"],
): StatusNotificationRule[] {
  return STATUS_NOTIFICATION_RULES.filter(
    (r) =>
      r.toStatus === toStatus &&
      (r.fromStatus === "*" || r.fromStatus === fromStatus),
  );
}
