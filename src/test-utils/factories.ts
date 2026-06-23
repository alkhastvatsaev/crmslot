/**
 * Shared test factories — use these instead of local iv() / makeUser() functions.
 * All factories accept a Partial override so tests only specify what they care about.
 */

import type { Intervention } from "@/features/interventions";

let _seq = 0;
const seq = () => String(++_seq).padStart(3, "0");

// ---------------------------------------------------------------------------
// Intervention
// ---------------------------------------------------------------------------

export function makeIntervention(
  partial: Partial<Intervention> & { id?: string } = {}
): Intervention {
  const id = partial.id ?? `iv-${seq()}`;
  return {
    id,
    title: "Remplacement serrure",
    address: "Rue de la Loi 16, 1000 Bruxelles",
    time: "09:00",
    status: "pending",
    location: { lat: 50.846, lng: 4.352 },
    companyId: "company-test",
    createdAt: "2026-01-15T08:00:00.000Z",
    ...partial,
  };
}

/** Shorthand: assigned to a technician, scheduled for today. */
export function makeAssignedIntervention(
  partial: Partial<Intervention> & { id?: string } = {}
): Intervention {
  return makeIntervention({
    status: "assigned",
    assignedTechnicianUid: "tech-uid",
    scheduledDate: "2026-01-15",
    scheduledTime: "10:00",
    ...partial,
  });
}

/** Shorthand: completed intervention with billing. */
export function makeDoneIntervention(
  partial: Partial<Intervention> & { id?: string } = {}
): Intervention {
  return makeIntervention({
    status: "done",
    assignedTechnicianUid: "tech-uid",
    billingLines: [{ description: "Main d'œuvre", quantity: 1, unitPriceCents: 12_000 }],
    completedAt: "2026-01-15T11:30:00.000Z",
    ...partial,
  });
}

// ---------------------------------------------------------------------------
// Reset counter between test files (called in jest.setup.ts afterEach)
// ---------------------------------------------------------------------------

export function resetFactorySequence() {
  _seq = 0;
}
