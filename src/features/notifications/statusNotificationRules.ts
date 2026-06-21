import type { Intervention } from "@/features/interventions/types";

// ---------------------------------------------------------------------------
// Status-based email notification rules
// ---------------------------------------------------------------------------

export type NotificationChannel = "email" | "sms" | "push" | "whatsapp";

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
 *
 * Critères d'utilité (pas de spam) :
 *   - une **action** attendue de la personne notifiée (valider, payer, se préparer,
 *     reprendre, compléter…) OU une info qu'elle **doit** savoir (annulation, refus).
 *   - on évite les pushs aux acteurs qui déclenchent eux-mêmes la transition
 *     (ex : admin notifié quand l'admin assigne → redondant).
 *   - email/WhatsApp restent les canaux pour les milestones longue trace.
 *
 * Audiences :
 *   - `client`     : demandeur (createdByUid) — voit sa demande progresser.
 *   - `technician` : tech assigné (assignedTechnicianUid).
 *   - `dispatcher` : tous les admins de la société (broadcast côté API).
 */
export const STATUS_NOTIFICATION_RULES: StatusNotificationRule[] = [
  // ─── Nouveau dossier → admin doit assigner ────────────────────────────────
  // Action attendue : prendre en charge.
  {
    fromStatus: "*",
    toStatus: "pending",
    targets: ["dispatcher"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.pending.subject",
    bodyKey: "notifications.email.pending.body",
  },

  // ─── Adresse manquante → client doit compléter, admin doit relancer ───────
  {
    fromStatus: "*",
    toStatus: "pending_needs_address",
    targets: ["client"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.needs_address.subject",
    bodyKey: "notifications.email.needs_address.body",
  },
  {
    fromStatus: "*",
    toStatus: "pending_needs_address",
    targets: ["dispatcher"],
    channels: ["push"],
    subjectKey: "notifications.push.needs_address_dispatcher.subject",
    bodyKey: "notifications.push.needs_address_dispatcher.body",
  },

  // ─── Assignation → client rassuré, tech doit voir sa nouvelle mission ─────
  // Pas de push admin : c'est l'admin qui assigne, redondant.
  {
    fromStatus: "*",
    toStatus: "assigned",
    targets: ["client"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.assigned.subject",
    bodyKey: "notifications.email.assigned.body",
  },
  {
    fromStatus: "*",
    toStatus: "assigned",
    targets: ["technician"],
    channels: ["push"],
    subjectKey: "notifications.push.assigned.subject",
    bodyKey: "notifications.push.assigned.body",
  },

  // ─── En route → client se prépare (porte, accès) ──────────────────────────
  // Pas de push admin : c'est le tech qui déclenche, l'admin n'a rien à faire.
  {
    fromStatus: "assigned",
    toStatus: "en_route",
    targets: ["client"],
    channels: ["push", "email", "whatsapp"],
    subjectKey: "notifications.email.en_route.subject",
    bodyKey: "notifications.email.en_route.body",
  },

  // ─── Démarrage intervention → client sait que ça commence ─────────────────
  // Pas de push admin (info passive, le tech la déclenche).
  {
    fromStatus: "en_route",
    toStatus: "in_progress",
    targets: ["client"],
    channels: ["push"],
    subjectKey: "notifications.push.in_progress.subject",
    bodyKey: "notifications.push.in_progress.body",
  },
  // Cas urgent (assigné → démarré sans en_route)
  {
    fromStatus: "assigned",
    toStatus: "in_progress",
    targets: ["client"],
    channels: ["push"],
    subjectKey: "notifications.push.in_progress.subject",
    bodyKey: "notifications.push.in_progress.body",
  },

  // ─── Intervention terminée → client info + admin doit valider rapport ─────
  {
    fromStatus: "in_progress",
    toStatus: "done",
    targets: ["client"],
    channels: ["push", "email", "whatsapp"],
    subjectKey: "notifications.email.done.subject",
    bodyKey: "notifications.email.done.body",
  },
  {
    fromStatus: "in_progress",
    toStatus: "done",
    targets: ["dispatcher"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.done_dispatcher.subject",
    bodyKey: "notifications.email.done_dispatcher.body",
  },

  // ─── Facture émise → client doit payer ────────────────────────────────────
  // Pas de push admin : l'admin facture lui-même.
  {
    fromStatus: "done",
    toStatus: "invoiced",
    targets: ["client"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.invoiced.subject",
    bodyKey: "notifications.email.invoiced.body",
  },

  // ─── Matériel attendu → client patiente, admin doit commander ─────────────
  // Pas de push tech : c'est lui qui le déclenche.
  {
    fromStatus: "in_progress",
    toStatus: "waiting_material",
    targets: ["client"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.waiting_material.subject",
    bodyKey: "notifications.email.waiting_material.body",
  },
  {
    fromStatus: "in_progress",
    toStatus: "waiting_material",
    targets: ["dispatcher"],
    channels: ["push"],
    subjectKey: "notifications.push.waiting_material.subject",
    bodyKey: "notifications.push.waiting_material.body",
  },

  // ─── Matériel reçu (waiting_material → in_progress) → tech doit reprendre ─
  // Pas de push client : info de coulisses, le déplacement tech va suivre.
  {
    fromStatus: "waiting_material",
    toStatus: "in_progress",
    targets: ["technician"],
    channels: ["push"],
    subjectKey: "notifications.push.material_received.subject",
    bodyKey: "notifications.push.material_received.body",
  },

  // ─── Annulation → tous concernés doivent stopper ──────────────────────────
  // Tech notifié seulement s'il était assigné (filtré côté dispatcher via prefs/UID).
  // Admin notifié car l'annulation peut venir du client (portail).
  {
    fromStatus: "*",
    toStatus: "cancelled",
    targets: ["client"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.cancelled.subject",
    bodyKey: "notifications.email.cancelled.body",
  },
  {
    fromStatus: "*",
    toStatus: "cancelled",
    targets: ["technician"],
    channels: ["push"],
    subjectKey: "notifications.push.cancelled_staff.subject",
    bodyKey: "notifications.push.cancelled_staff.body",
  },
  {
    fromStatus: "*",
    toStatus: "cancelled",
    targets: ["dispatcher"],
    channels: ["push"],
    subjectKey: "notifications.push.cancelled_staff.subject",
    bodyKey: "notifications.push.cancelled_staff.body",
  },

  // ─── Refus rapport (done → in_progress) → tech doit corriger ──────────────
  {
    fromStatus: "done",
    toStatus: "in_progress",
    targets: ["technician"],
    channels: ["push", "email"],
    subjectKey: "notifications.email.report_rejected.subject",
    bodyKey: "notifications.email.report_rejected.body",
  },
];

/**
 * Trouve les règles applicables pour une transition donnée.
 */
export function findApplicableRules(
  fromStatus: Intervention["status"],
  toStatus: Intervention["status"]
): StatusNotificationRule[] {
  return STATUS_NOTIFICATION_RULES.filter(
    (r) => r.toStatus === toStatus && (r.fromStatus === "*" || r.fromStatus === fromStatus)
  );
}
