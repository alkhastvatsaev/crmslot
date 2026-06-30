import { z } from "zod";

/** Contrats partagés pour les routes API interventions critiques. */

export const InterventionStatusSchema = z.enum([
  "draft",
  "to_assign",
  "assigned",
  "en_route",
  "on_site",
  "waiting_material",
  "done",
  "invoiced",
  "cancelled",
]);
export type InterventionStatus = z.infer<typeof InterventionStatusSchema>;

export const InterventionDocumentKindSchema = z.enum(["report", "invoice", "quote"]);
export type InterventionDocumentKind = z.infer<typeof InterventionDocumentKindSchema>;

/** GET /api/interventions/[id]/document-pdf?type=invoice */
export const DocumentPdfQuerySchema = z.object({
  type: InterventionDocumentKindSchema.default("invoice"),
});

/** POST /api/interventions/[id]/validate-report — émission facture après validation rapport. */
export const ValidateReportRequestSchema = z.object({
  sendEmail: z.boolean().optional(),
});
export type ValidateReportRequest = z.infer<typeof ValidateReportRequestSchema>;

export const ValidateReportSuccessResponseSchema = z.object({
  ok: z.literal(true),
  invoicePdfUrl: z.string(),
  invoiceAmountCents: z.number(),
  emailSent: z.boolean(),
  emailError: z.string().optional(),
});

export const ValidateReportErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
});

export const ValidateReportResponseSchema = z.discriminatedUnion("ok", [
  ValidateReportSuccessResponseSchema,
  ValidateReportErrorResponseSchema,
]);
export type ValidateReportResponse = z.infer<typeof ValidateReportResponseSchema>;
