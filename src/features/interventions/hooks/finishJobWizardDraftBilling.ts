"use client";

import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { logger } from "@/core/logger";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";

export type FinishJobDraftBillingPayload = {
  billingLines: DraftBillingLine[];
  aiNote: string | null;
};

export async function prefetchFinishJobDraftBilling(
  ivId: string
): Promise<FinishJobDraftBillingPayload | null> {
  try {
    const res = await fetchWithAuth(
      `/api/interventions/${encodeURIComponent(ivId)}/prepare-draft-billing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRegenerate: true }),
      }
    );
    const data = (await res.json()) as {
      ok?: boolean;
      billingLines?: DraftBillingLine[];
      aiNote?: string;
    };
    if (res.ok && data.ok && Array.isArray(data.billingLines)) {
      return {
        billingLines: data.billingLines,
        aiNote: typeof data.aiNote === "string" ? data.aiNote : null,
      };
    }
  } catch (err) {
    logger.warn("[prefetch-draft-billing]", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}
