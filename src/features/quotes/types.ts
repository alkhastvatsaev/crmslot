export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";

export interface QuoteLine {
  description: string;
  quantity: number;
  unitPriceCents: number;
  reference?: string;
}

export interface Quote {
  id: string;
  companyId: string;
  clientId?: string | null;
  interventionId?: string | null;
  status: QuoteStatus;
  lines: QuoteLine[];
  /** Total HT en centimes (dénormalisé). */
  totalCents: number;
  validityDays: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
  respondedAt?: string | null;
  expiresAt?: string | null;
  createdByUid?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
}
