import { setDoc, doc, updateDoc, type Firestore } from "firebase/firestore";
import { calculateCommission } from "@/features/commissions/engine";
import {
  appendCommissionAuditEntry,
  COMMISSION_OVERRIDES_COLLECTION,
  subscribeCommissionRules,
} from "@/features/commissions/commissionFirestore";
import type { CommissionRule, InterventionCommission } from "@/features/commissions/types";

const DEFAULT_INVOICE_AMOUNT_CENTS = 15_000;

export function resolveInvoiceBaseAmountCents(
  invoiceAmountCents: number | null | undefined,
): number {
  if (typeof invoiceAmountCents === "number" && invoiceAmountCents > 0) {
    return Math.round(invoiceAmountCents);
  }
  return DEFAULT_INVOICE_AMOUNT_CENTS;
}

/** Charge les règles actives une fois (usage serveur / tests). */
export async function loadActiveCommissionRules(
  db: Firestore,
  companyId: string,
): Promise<CommissionRule[]> {
  return new Promise((resolve, reject) => {
    const unsub = subscribeCommissionRules(
      db,
      companyId,
      (rows) => {
        unsub();
        resolve(rows);
      },
      (e) => {
        unsub();
        reject(e);
      },
    );
  });
}

export async function computeAndPersistInterventionCommission(params: {
  db: Firestore;
  interventionId: string;
  companyId: string | null;
  technicianUid: string | null;
  invoiceAmountCents?: number | null;
  auditByUid?: string;
  existingOverride?: Pick<
    InterventionCommission,
    "isManualOverride" | "finalCommissionAmount" | "overrideReason" | "overrideByUid"
  > | null;
}): Promise<{ baseAmountCents: number; commissionAmountCents: number }> {
  const { db, interventionId, companyId, technicianUid, existingOverride } = params;
  const baseAmountCents = resolveInvoiceBaseAmountCents(params.invoiceAmountCents);
  const baseAmount = baseAmountCents / 100;

  if (existingOverride?.isManualOverride) {
    const finalCents = Math.round(existingOverride.finalCommissionAmount * 100);
    await setDoc(
      doc(db, COMMISSION_OVERRIDES_COLLECTION, interventionId),
      {
        interventionId,
        baseAmount,
        finalCommissionAmount: existingOverride.finalCommissionAmount,
        isManualOverride: true,
        overrideReason: existingOverride.overrideReason ?? null,
        overrideByUid: existingOverride.overrideByUid ?? null,
        appliedRuleId: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    await updateDoc(doc(db, "interventions", interventionId), {
      commissionAmountCents: finalCents,
      invoiceAmountCents: baseAmountCents,
    });
    return { baseAmountCents, commissionAmountCents: finalCents };
  }

  const rules =
    companyId && companyId.trim()
      ? await loadActiveCommissionRules(db, companyId.trim())
      : [];

  const computed = calculateCommission(
    {
      interventionId,
      technicianUid,
      groupId: companyId,
      baseAmount,
    },
    rules,
  );

  const commissionAmountCents = Math.round(computed.finalCommissionAmount * 100);

  await setDoc(
    doc(db, COMMISSION_OVERRIDES_COLLECTION, interventionId),
    {
      ...computed,
      isManualOverride: false,
      overrideReason: null,
      overrideByUid: null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  await updateDoc(doc(db, "interventions", interventionId), {
    commissionAmountCents,
    invoiceAmountCents: baseAmountCents,
  });

  if (companyId?.trim()) {
    await appendCommissionAuditEntry(db, {
      companyId: companyId.trim(),
      interventionId,
      action: "calculated",
      finalCommissionAmount: computed.finalCommissionAmount,
      byUid: params.auditByUid?.trim() || "system",
    });
  }

  return { baseAmountCents, commissionAmountCents };
}
