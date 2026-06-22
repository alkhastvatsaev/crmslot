/**
 * API publique billing — domaine facturation (PDF, UBL, Stripe).
 * UI slot pager → voir billingHub/.
 */
export { generateInterventionDocumentPdf } from "@/features/billing/generateQuotePdf";
export { generateInterventionReport } from "@/features/billing/generateInterventionReport";
export { invoicePreviewFromIntervention } from "@/features/billing/invoicePreviewFromIntervention";
export { downloadAccountingCsv } from "@/features/billing/exportAccountingCsv";
export type { BillingPdfBranding } from "@/features/billing/billingPdfBranding";
export { isValidInvoiceNumber, formatInvoiceNumber } from "@/features/billing/invoiceNumbering";
