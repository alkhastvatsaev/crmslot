import type { ProposedSlot } from "@/features/scheduling/proposeAvailableSlots";

/** Choisit un créneau : heure demandée si libre, sinon le premier disponible. */
export function pickRecommendedSlot(
  slots: ProposedSlot[],
  preferredTime?: string | null,
): string | null {
  if (slots.length === 0) return null;
  const pref = preferredTime?.trim();
  if (pref && slots.some((s) => s.time === pref)) return pref;
  return slots[0]!.time;
}
