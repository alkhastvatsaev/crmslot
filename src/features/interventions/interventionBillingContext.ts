import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import type { Intervention } from "@/features/interventions/types";

const TRAVEL_STANDARD_CENTS = 3500;
const TRAVEL_URGENT_CENTS = 4500;
const TRAVEL_LONG_DISTANCE_CENTS = 5500;
const LABOR_HOURLY_CENTS = 5500;
const NIGHT_SURCHARGE_LINE = "Majoration soir / week-end";
const NIGHT_SURCHARGE_RATE = 0.25;

export type InterventionBillingContext = Partial<
  Pick<
    Intervention,
    | "problem"
    | "title"
    | "category"
    | "address"
    | "clientName"
    | "urgency"
    | "priority"
    | "transcription"
    | "scheduledDate"
    | "scheduledTime"
    | "requestedDate"
    | "requestedTime"
    | "hour"
    | "date"
    | "time"
    | "estimatedDurationMinutes"
    | "actualDurationMinutes"
    | "completionPhotos"
    | "location"
  >
>;

function normalizeTravelDescription(desc: string): boolean {
  const d = desc.toLowerCase();
  return d.includes("déplacement") || d.includes("deplacement");
}

function normalizeLaborDescription(desc: string): boolean {
  const d = desc.toLowerCase();
  return d.includes("main d") || d.includes("main-d") || d.includes("mo ");
}

export function interventionProblemText(iv: InterventionBillingContext): string {
  return [iv.problem, iv.title, iv.transcription].filter(Boolean).join(" ").trim();
}

export function resolveInterventionSchedule(iv: InterventionBillingContext): {
  dateYmd: string | null;
  timeHm: string | null;
} {
  const dateYmd = iv.scheduledDate?.trim() || iv.requestedDate?.trim() || iv.date?.trim() || null;
  const timeHm =
    iv.scheduledTime?.trim() ||
    iv.requestedTime?.trim() ||
    iv.hour?.trim() ||
    iv.time?.trim() ||
    null;
  return { dateYmd, timeHm };
}

export function isAfterHoursOrWeekend(dateYmd: string | null, timeHm: string | null): boolean {
  if (dateYmd) {
    const day = new Date(`${dateYmd}T12:00:00`).getDay();
    if (day === 0 || day === 6) return true;
  }
  if (!timeHm) return false;
  const match = /^(\d{1,2}):(\d{2})/.exec(timeHm);
  if (!match) return false;
  const hours = Number(match[1]);
  return hours < 7 || hours >= 19;
}

export function isLongDistanceAddress(address: string | null | undefined): boolean {
  const hay = (address ?? "").toLowerCase();
  if (!hay.trim()) return false;
  const distantHints = [
    "anvers",
    "antwerpen",
    "gand",
    "gent",
    "liège",
    "liege",
    "charleroi",
    "namur",
    "mons",
    "louvain",
    "leuven",
    "bruges",
    "brugge",
    "hasselt",
    "tournai",
    "mouscron",
  ];
  const brusselsHints = ["bruxelles", "brussel", "ixelles", "uccle", "etterbeek", "schaerbeek"];
  const isBrussels = brusselsHints.some((h) => hay.includes(h));
  if (isBrussels) return false;
  return distantHints.some((h) => hay.includes(h));
}

export function resolveTravelUnitPriceCents(iv: InterventionBillingContext): number {
  if (isLongDistanceAddress(iv.address)) return TRAVEL_LONG_DISTANCE_CENTS;
  if (iv.urgency || iv.priority === "urgent" || iv.priority === "high") return TRAVEL_URGENT_CENTS;
  return TRAVEL_STANDARD_CENTS;
}

export function materialHintsFromPhotos(
  iv: Pick<InterventionBillingContext, "completionPhotos">
): string[] {
  const cats = new Set((iv.completionPhotos ?? []).map((p) => p.category));
  const hints: string[] = [];
  if (cats.has("materiel")) hints.push("Photos terrain : matériel / pièces utilisées");
  if (cats.has("panne")) hints.push("Photos terrain : constat panne");
  return hints;
}

/** Règles déterministes avant / après enrichissement IA. */
export function enrichDraftBillingLines(
  iv: InterventionBillingContext,
  lines: DraftBillingLine[]
): DraftBillingLine[] {
  const travelCents = resolveTravelUnitPriceCents(iv);
  const { dateYmd, timeHm } = resolveInterventionSchedule(iv);
  const afterHours = isAfterHoursOrWeekend(dateYmd, timeHm);

  let next = lines.map((line) => {
    if (normalizeTravelDescription(line.description)) {
      const urgentLabel =
        travelCents >= TRAVEL_URGENT_CENTS ? "Déplacement urgent" : "Déplacement forfaitaire";
      return {
        ...line,
        description: line.description.toLowerCase().includes("urgent")
          ? line.description
          : urgentLabel,
        unitPriceCents: travelCents,
      };
    }
    if (normalizeLaborDescription(line.description) && line.unitPriceCents <= 0) {
      return { ...line, unitPriceCents: LABOR_HOURLY_CENTS };
    }
    return line;
  });

  const actualMin = iv.actualDurationMinutes ?? iv.estimatedDurationMinutes ?? null;
  if (typeof actualMin === "number" && actualMin > 75) {
    const extraHours = Math.max(1, Math.ceil((actualMin - 60) / 60));
    const hasExtraLabor = next.some((l) =>
      l.description.toLowerCase().includes("heure supplémentaire")
    );
    if (!hasExtraLabor) {
      next = [
        ...next,
        {
          description: "Main d'œuvre supplémentaire (durée terrain)",
          quantity: extraHours,
          unitPriceCents: LABOR_HOURLY_CENTS,
          reference: "mo-extra",
        },
      ];
    }
  }

  if (afterHours) {
    const subtotal = next.reduce(
      (sum, l) => sum + Math.round(l.unitPriceCents) * (l.quantity > 0 ? l.quantity : 1),
      0
    );
    const surchargeCents = Math.round(subtotal * NIGHT_SURCHARGE_RATE);
    const hasSurcharge = next.some((l) => l.description.toLowerCase().includes("majoration"));
    if (surchargeCents > 0 && !hasSurcharge) {
      next = [
        ...next,
        {
          description: NIGHT_SURCHARGE_LINE,
          quantity: 1,
          unitPriceCents: surchargeCents,
          reference: "majoration",
        },
      ];
    }
  }

  return next.filter((l) => l.description.trim().length > 0);
}

export function buildInterventionBillingContextText(iv: InterventionBillingContext): string {
  const { dateYmd, timeHm } = resolveInterventionSchedule(iv);
  const afterHours = isAfterHoursOrWeekend(dateYmd, timeHm);
  const photoHints = materialHintsFromPhotos(iv);

  return [
    iv.clientName ? `Client : ${iv.clientName}` : null,
    iv.address ? `Adresse intervention : ${iv.address}` : null,
    iv.category ? `Catégorie : ${iv.category}` : null,
    iv.problem ? `Demande client (problème) : ${iv.problem}` : null,
    iv.title ? `Titre dossier : ${iv.title}` : null,
    iv.transcription ? `Transcription vocale client : ${iv.transcription}` : null,
    dateYmd || timeHm ? `Créneau : ${[dateYmd, timeHm].filter(Boolean).join(" ")}` : null,
    iv.urgency ? "Urgence client : oui" : null,
    iv.priority ? `Priorité : ${iv.priority}` : null,
    afterHours ? "Majoration soir/week-end applicable" : null,
    isLongDistanceAddress(iv.address) ? "Trajet long (hors Bruxelles proche)" : null,
    typeof iv.estimatedDurationMinutes === "number"
      ? `Durée prévue : ${iv.estimatedDurationMinutes} min`
      : null,
    typeof iv.actualDurationMinutes === "number"
      ? `Durée réelle terrain : ${iv.actualDurationMinutes} min`
      : null,
    ...photoHints,
  ]
    .filter(Boolean)
    .join("\n");
}
