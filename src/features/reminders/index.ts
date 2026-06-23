/**
 * API publique reminders — rappels métier dérivés interventions.
 */
export { buildInterventionReminders } from "@/features/reminders/interventionReminders";
export type { InterventionReminder } from "@/features/reminders/interventionReminders";
export { useBackofficeReminderPush } from "@/features/reminders/useBackofficeReminderPush";
export { default as InterventionRemindersPanel } from "@/features/reminders/components/InterventionRemindersPanel";
