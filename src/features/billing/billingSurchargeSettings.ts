import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";

export type BillingSurchargeApplyTo = "subtotal" | "subtotal_excl_travel";

export type BillingSurchargeSettings = {
  enabled: boolean;
  lineLabel: string;
  weekendDays: number[];
  weekendRatePercent: number;
  afterHour: number;
  afterHourRatePercent: number;
  beforeHour: number | null;
  beforeHourRatePercent: number;
  applyTo: BillingSurchargeApplyTo;
};

export const DEFAULT_BILLING_SURCHARGE_SETTINGS: BillingSurchargeSettings = {
  enabled: true,
  lineLabel: "Majoration soir / week-end",
  weekendDays: [0, 6],
  weekendRatePercent: 50,
  afterHour: 19,
  afterHourRatePercent: 50,
  beforeHour: null,
  beforeHourRatePercent: 0,
  applyTo: "subtotal",
};

function clampPercent(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(200, Math.max(0, Math.round(n)));
}

function clampHour(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(23, Math.max(0, Math.round(n)));
}

function normalizeWeekendDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [...DEFAULT_BILLING_SURCHARGE_SETTINGS.weekendDays];
  const days = value.map((d) => Number(d)).filter((d) => Number.isFinite(d) && d >= 0 && d <= 6);
  return days.length > 0 ? [...new Set(days)] : [...DEFAULT_BILLING_SURCHARGE_SETTINGS.weekendDays];
}

export function normalizeBillingSurchargeSettings(raw: unknown): BillingSurchargeSettings {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const beforeHourRaw = data.beforeHour;
  const beforeHour =
    beforeHourRaw === null || beforeHourRaw === undefined || beforeHourRaw === ""
      ? null
      : clampHour(beforeHourRaw, 7);

  return {
    enabled: data.enabled !== false,
    lineLabel:
      typeof data.lineLabel === "string" && data.lineLabel.trim()
        ? data.lineLabel.trim()
        : DEFAULT_BILLING_SURCHARGE_SETTINGS.lineLabel,
    weekendDays: normalizeWeekendDays(data.weekendDays),
    weekendRatePercent: clampPercent(
      data.weekendRatePercent,
      DEFAULT_BILLING_SURCHARGE_SETTINGS.weekendRatePercent
    ),
    afterHour: clampHour(data.afterHour, DEFAULT_BILLING_SURCHARGE_SETTINGS.afterHour),
    afterHourRatePercent: clampPercent(
      data.afterHourRatePercent,
      DEFAULT_BILLING_SURCHARGE_SETTINGS.afterHourRatePercent
    ),
    beforeHour,
    beforeHourRatePercent: clampPercent(data.beforeHourRatePercent, 0),
    applyTo: data.applyTo === "subtotal_excl_travel" ? "subtotal_excl_travel" : "subtotal",
  };
}

export function parseScheduleTimeHours(timeHm: string | null): number | null {
  if (!timeHm?.trim()) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(timeHm.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours + minutes / 60;
}

export function resolveBillingSurchargeRatePercent(
  dateYmd: string | null,
  timeHm: string | null,
  settings: BillingSurchargeSettings
): number {
  if (!settings.enabled) return 0;

  let rate = 0;

  if (dateYmd) {
    const day = new Date(`${dateYmd}T12:00:00`).getDay();
    if (settings.weekendDays.includes(day) && settings.weekendRatePercent > 0) {
      rate = Math.max(rate, settings.weekendRatePercent);
    }
  }

  const timeHours = parseScheduleTimeHours(timeHm);
  if (timeHours !== null) {
    if (timeHours >= settings.afterHour && settings.afterHourRatePercent > 0) {
      rate = Math.max(rate, settings.afterHourRatePercent);
    }
    if (
      settings.beforeHour !== null &&
      timeHours < settings.beforeHour &&
      settings.beforeHourRatePercent > 0
    ) {
      rate = Math.max(rate, settings.beforeHourRatePercent);
    }
  }

  return rate;
}

function isTravelLine(line: DraftBillingLine): boolean {
  const d = line.description.toLowerCase();
  return d.includes("déplacement") || d.includes("deplacement");
}

function surchargeBaseCents(lines: DraftBillingLine[], applyTo: BillingSurchargeApplyTo): number {
  return lines.reduce((sum, line) => {
    if (applyTo === "subtotal_excl_travel" && isTravelLine(line.description)) return sum;
    const qty = line.quantity > 0 ? line.quantity : 1;
    return sum + Math.round(line.unitPriceCents) * qty;
  }, 0);
}

export function applyBillingSurchargeToLines(
  lines: DraftBillingLine[],
  dateYmd: string | null,
  timeHm: string | null,
  settings: BillingSurchargeSettings = DEFAULT_BILLING_SURCHARGE_SETTINGS
): DraftBillingLine[] {
  const ratePercent = resolveBillingSurchargeRatePercent(dateYmd, timeHm, settings);
  if (ratePercent <= 0) return lines;

  const hasSurcharge = lines.some(
    (l) => l.reference === "majoration" || l.description.toLowerCase().includes("majoration")
  );
  if (hasSurcharge) return lines;

  const baseCents = surchargeBaseCents(lines, settings.applyTo);
  const surchargeCents = Math.round((baseCents * ratePercent) / 100);
  if (surchargeCents <= 0) return lines;

  return [
    ...lines,
    {
      description: settings.lineLabel,
      quantity: 1,
      unitPriceCents: surchargeCents,
      reference: "majoration",
    },
  ];
}
