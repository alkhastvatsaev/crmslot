import type { Intervention } from "@/features/interventions/types";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";

export type PlanningDetailField = {
  id: string;
  labelKey: string;
  value: string;
};

function readTranscription(iv: Intervention): string | null {
  const hit = iv.transcription?.trim();
  return hit || null;
}

function formatSchedule(
  date: string | null | undefined,
  time: string | null | undefined
): string | null {
  const d = date?.trim();
  if (!d) return null;
  const tm = time?.trim();
  return tm ? `${d} · ${tm}` : d;
}

function formatCents(cents: number | null | undefined): string | null {
  if (cents == null || !Number.isFinite(cents)) return null;
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatBillingLines(iv: Intervention): string | null {
  const lines = iv.billingLines?.filter((l) => l.description?.trim());
  if (!lines?.length) return null;
  return lines
    .map((line) => {
      const unit = (line.unitPriceCents / 100).toFixed(2);
      return `${line.description.trim()} · ${line.quantity} × ${unit} €`;
    })
    .join("\n");
}

function pushField(
  out: PlanningDetailField[],
  id: string,
  labelKey: string,
  raw: string | null | undefined
) {
  const value = raw?.trim();
  if (!value) return;
  out.push({ id, labelKey, value });
}

/** Données saisies par le client (formulaire / demande). */
export function buildClientIntakeFields(iv: Intervention): PlanningDetailField[] {
  const out: PlanningDetailField[] = [];

  pushField(out, "name", "planningHub.detail.fields.name", resolveInterventionClientName(iv));
  pushField(out, "company", "planningHub.detail.fields.company", iv.clientCompanyName);
  pushField(
    out,
    "phone",
    "planningHub.detail.fields.phone",
    iv.clientPhone ?? iv.phone ?? undefined
  );
  pushField(out, "email", "planningHub.detail.fields.email", iv.clientEmail);
  pushField(out, "whatsapp", "planningHub.detail.fields.whatsapp", iv.clientWhatsapp);
  pushField(out, "address", "planningHub.detail.fields.address", iv.address);
  pushField(out, "category", "planningHub.detail.fields.category", iv.category);
  if (iv.urgency) {
    pushField(out, "urgency", "planningHub.detail.fields.urgency_yes", "✓");
  }
  pushField(out, "problem", "planningHub.detail.fields.problem", iv.problem);
  pushField(out, "title", "planningHub.detail.fields.title", iv.title);
  pushField(
    out,
    "requested",
    "planningHub.detail.fields.requested_schedule",
    formatSchedule(iv.requestedDate, iv.requestedTime) ??
      formatSchedule(iv.date, iv.hour ?? iv.time)
  );
  pushField(out, "transcription", "planningHub.detail.fields.transcription", readTranscription(iv));

  const clientPhotos = iv.attachmentThumbnails?.filter(Boolean).length ?? 0;
  if (clientPhotos > 0) {
    pushField(out, "client_photos", "planningHub.detail.fields.photos_count", String(clientPhotos));
  }

  return out;
}

/** Données terrain / clôture technicien. */
export function buildTechnicianReportFields(iv: Intervention): PlanningDetailField[] {
  const out: PlanningDetailField[] = [];

  pushField(out, "status", "planningHub.detail.fields.status", iv.status?.replace(/_/g, " "));
  pushField(
    out,
    "scheduled",
    "planningHub.detail.fields.assigned_schedule",
    formatSchedule(iv.scheduledDate, iv.scheduledTime)
  );
  pushField(out, "accepted", "planningHub.detail.fields.accepted_at", iv.technicianAcceptedAt);
  pushField(out, "arrived", "planningHub.detail.fields.arrived_at", iv.autoArrivedAt);
  pushField(out, "completed", "planningHub.detail.fields.completed_at", iv.completedAt);
  if (iv.actualDurationMinutes != null && iv.actualDurationMinutes > 0) {
    pushField(
      out,
      "duration",
      "planningHub.detail.fields.duration",
      `${iv.actualDurationMinutes} min`
    );
  }
  pushField(out, "billing", "planningHub.detail.fields.billing_lines", formatBillingLines(iv));
  pushField(
    out,
    "invoice",
    "planningHub.detail.fields.invoice_amount",
    formatCents(iv.invoiceAmountCents)
  );
  pushField(
    out,
    "commission",
    "planningHub.detail.fields.commission",
    formatCents(iv.commissionAmountCents)
  );
  pushField(out, "payment", "planningHub.detail.fields.payment_status", iv.paymentStatus);
  if (iv.completionSignatureUrl?.trim() || iv.remoteSignatureUrl?.trim()) {
    pushField(out, "signature", "planningHub.detail.fields.signature_yes", "✓");
  }
  pushField(
    out,
    "amended",
    "planningHub.detail.fields.report_amended",
    iv.technicianReportAmendedAt
  );
  pushField(
    out,
    "rejection",
    "planningHub.detail.fields.rejection_reason",
    iv.reportRejectionReason
  );

  const completionPhotos = iv.completionPhotos?.length ?? iv.completionPhotoUrls?.length ?? 0;
  if (completionPhotos > 0) {
    pushField(
      out,
      "completion_photos",
      "planningHub.detail.fields.photos_count",
      String(completionPhotos)
    );
  }

  return out;
}

export function clientIntakePhotoUrls(iv: Intervention): string[] {
  return iv.attachmentThumbnails?.filter(Boolean) ?? [];
}

export function technicianCompletionPhotoUrls(iv: Intervention): string[] {
  if (iv.completionPhotos?.length) {
    return iv.completionPhotos.map((p) => p.url).filter(Boolean);
  }
  return iv.completionPhotoUrls?.filter(Boolean) ?? [];
}

export function technicianSignatureUrl(iv: Intervention): string | null {
  return iv.completionSignatureUrl?.trim() || iv.remoteSignatureUrl?.trim() || null;
}
