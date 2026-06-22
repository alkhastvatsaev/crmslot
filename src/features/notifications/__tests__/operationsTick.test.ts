import {
  findLateInterventions,
  findUnpaidInvoices,
  LATE_THRESHOLD_MIN,
} from "@/features/notifications/operationsTick";
import type { Intervention } from "@/features/interventions/types";

const baseIv = (overrides: Partial<Intervention> = {}): Intervention =>
  ({
    id: "iv-1",
    status: "assigned",
    title: "Ouverture porte",
    address: "Rue de la Loi 1",
    scheduledDate: "2026-06-22",
    scheduledTime: "10:00",
    createdByUid: "client-uid",
    assignedTechnicianUid: "tech-uid",
    companyId: "co-1",
    ...overrides,
  }) as Intervention;

describe("findLateInterventions", () => {
  it("flague un dossier en retard au-delà du seuil (15 min)", () => {
    // RDV à 10h00, maintenant 10h16 → 16 min de retard.
    const now = new Date("2026-06-22T08:16:00.000Z"); // 10h16 Brussels (UTC+2 été)
    const result = findLateInterventions([baseIv()], now);
    expect(result).toHaveLength(1);
    expect(result[0]?.minutesLate).toBeGreaterThanOrEqual(LATE_THRESHOLD_MIN);
  });

  it("ignore les dossiers déjà notifiés", () => {
    const now = new Date("2026-06-22T08:30:00.000Z");
    const result = findLateInterventions(
      [baseIv({ lateNotificationSentAt: "2026-06-22T08:20:00.000Z" })],
      now
    );
    expect(result).toHaveLength(0);
  });

  it("ignore les statuts in_progress / done", () => {
    const now = new Date("2026-06-22T08:30:00.000Z");
    const result = findLateInterventions(
      [baseIv({ status: "in_progress" }), baseIv({ id: "iv-2", status: "done" })],
      now
    );
    expect(result).toHaveLength(0);
  });

  it("ignore les retards extrêmes (> 8h, dossiers oubliés)", () => {
    const now = new Date("2026-06-22T18:00:00.000Z"); // ~ 10h après RDV en heure d'été
    const result = findLateInterventions([baseIv()], now);
    expect(result).toHaveLength(0);
  });
});

describe("findUnpaidInvoices", () => {
  it("flague à J+7 exactement", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    const invoicedAt = "2026-06-15T10:00:00.000Z";
    const result = findUnpaidInvoices(
      [
        baseIv({
          id: "iv-paid",
          status: "invoiced",
          paymentStatus: "unpaid",
          invoicedAt,
          invoiceAmountCents: 15000,
        }) as Intervention,
      ],
      now
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.reminderKey).toBe(7);
  });

  it("ignore une facture déjà payée", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    const result = findUnpaidInvoices(
      [
        baseIv({
          status: "invoiced",
          paymentStatus: "paid",
          invoicedAt: "2026-06-15T10:00:00.000Z",
          paidAt: "2026-06-16T10:00:00.000Z",
        }) as Intervention,
      ],
      now
    );
    expect(result).toHaveLength(0);
  });

  it("ignore les rappels déjà envoyés pour cette borne", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    const result = findUnpaidInvoices(
      [
        baseIv({
          status: "invoiced",
          paymentStatus: "unpaid",
          invoicedAt: "2026-06-15T10:00:00.000Z",
          unpaidReminders: { j7: "2026-06-22T08:00:00.000Z" },
        }) as Intervention,
      ],
      now
    );
    expect(result).toHaveLength(0);
  });

  it("flague à J+14", () => {
    const now = new Date("2026-06-22T10:00:00.000Z");
    const result = findUnpaidInvoices(
      [
        baseIv({
          status: "invoiced",
          paymentStatus: "unpaid",
          invoicedAt: "2026-06-08T10:00:00.000Z",
        }) as Intervention,
      ],
      now
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.reminderKey).toBe(14);
  });
});
