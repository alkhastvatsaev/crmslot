import { z } from "zod";

/**
 * Contrat partagé client/server pour `POST /api/notifications/send`.
 * Source de vérité unique : client (UI) ET serveur (route handler) référencent ce schéma.
 */

export const NotificationChannelSchema = z.enum(["email", "sms", "push"]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const NotificationVariablesSchema = z.record(z.string(), z.string()).default({});
export type NotificationVariables = z.infer<typeof NotificationVariablesSchema>;

export const SendNotificationRequestSchema = z.object({
  channel: NotificationChannelSchema,
  recipientRole: z.enum(["dispatcher", "technician", "client"]).optional(),
  subjectKey: z.string().min(1),
  bodyKey: z.string().min(1),
  variables: NotificationVariablesSchema,
});
export type SendNotificationRequest = z.infer<typeof SendNotificationRequestSchema>;

export const SendNotificationResponseSchema = z.object({
  success: z.boolean(),
  channel: NotificationChannelSchema.optional(),
  skipped: z.boolean().optional(),
  reason: z.string().optional(),
  sent: z.number().int().nonnegative().optional(),
  failed: z.number().int().nonnegative().optional(),
  removedStale: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
});
export type SendNotificationResponse = z.infer<typeof SendNotificationResponseSchema>;
