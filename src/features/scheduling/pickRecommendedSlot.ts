import { normalizeTimeHm } from "@/features/interventions/technicianScheduleParse";
import type { ProposedSlot } from "@/features/scheduling/proposeAvailableSlots";

function timeToMinutes(timeHm: string): number | null {
  const normalized = normalizeTimeHm(timeHm);
  if (!normalized) return null;
  const [hh, mm] = normalized.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

/** Choisit un créneau : heure demandée si libre, sinon le plus proche disponible. */
export function pickRecommendedSlot(
  slots: ProposedSlot[],
  preferredTime?: string | null
): string | null {
  if (slots.length === 0) return null;
  const pref = normalizeTimeHm(preferredTime);
  if (pref && slots.some((s) => s.time === pref)) return pref;

  if (pref) {
    const prefMinutes = timeToMinutes(pref);
    if (prefMinutes != null) {
      let best = slots[0]!;
      let bestDistance = Infinity;
      for (const slot of slots) {
        const slotMinutes = timeToMinutes(slot.time);
        if (slotMinutes == null) continue;
        const distance = Math.abs(slotMinutes - prefMinutes);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = slot;
        }
      }
      return best.time;
    }
  }

  return slots[0]!.time;
}
