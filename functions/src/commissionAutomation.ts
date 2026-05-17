import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const DEFAULT_INVOICE_AMOUNT_CENTS = 15_000;

type CommissionRule = {
  id: string;
  level: "group" | "technician" | "intervention";
  targetId: string;
  valueType: "percentage" | "fixed_amount";
  value: number;
};

function calculateCommissionCents(
  context: {
    interventionId: string;
    technicianUid: string | null;
    groupId: string | null;
    baseAmountCents: number;
  },
  rules: CommissionRule[],
): { commissionAmountCents: number; appliedRuleId: string | null } {
  const { interventionId, technicianUid, groupId, baseAmountCents } = context;
  const baseAmount = baseAmountCents / 100;

  const interventionRule = rules.find(
    (r) => r.level === "intervention" && r.targetId === interventionId,
  );
  const technicianRule = rules.find(
    (r) => r.level === "technician" && r.targetId === (technicianUid ?? ""),
  );
  const groupRule = rules.find((r) => r.level === "group" && r.targetId === (groupId ?? ""));

  const appliedRule = interventionRule ?? technicianRule ?? groupRule;
  if (!appliedRule) return { commissionAmountCents: 0, appliedRuleId: null };

  let euros = 0;
  if (appliedRule.valueType === "percentage") {
    euros = (baseAmount * appliedRule.value) / 100;
  } else {
    euros = appliedRule.value;
  }
  return {
    commissionAmountCents: Math.round(euros * 100),
    appliedRuleId: appliedRule.id,
  };
}

/** Calcule et persiste la commission après facturation automatique. */
export async function runCommissionOnInvoiced(
  interventionId: string,
  after: admin.firestore.DocumentData,
): Promise<void> {
  const db = admin.firestore();
  const companyId =
    typeof after.companyId === "string" && after.companyId.length > 0 ? after.companyId : null;
  const technicianUid =
    typeof after.assignedTechnicianUid === "string" ? after.assignedTechnicianUid : null;

  const overrideSnap = await db.collection("commission_overrides").doc(interventionId).get();
  const override = overrideSnap.exists ? overrideSnap.data() : undefined;

  const invoiceAmountCents =
    typeof after.invoiceAmountCents === "number" && after.invoiceAmountCents > 0
      ? Math.round(after.invoiceAmountCents)
      : DEFAULT_INVOICE_AMOUNT_CENTS;

  if (override?.isManualOverride === true) {
    const finalCents = Math.round(Number(override.finalCommissionAmount ?? 0) * 100);
    await db.collection("interventions").doc(interventionId).set(
      {
        commissionAmountCents: finalCents,
        invoiceAmountCents,
      },
      { merge: true },
    );
    return;
  }

  let rules: CommissionRule[] = [];
  if (companyId) {
    const rulesSnap = await db
      .collection("commission_rules")
      .where("companyId", "==", companyId)
      .where("isActive", "==", true)
      .get();
    rules = rulesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CommissionRule));
  }

  const { commissionAmountCents, appliedRuleId } = calculateCommissionCents(
    { interventionId, technicianUid, groupId: companyId, baseAmountCents: invoiceAmountCents },
    rules,
  );

  const baseAmount = invoiceAmountCents / 100;
  const finalCommissionAmount = commissionAmountCents / 100;

  await db
    .collection("commission_overrides")
    .doc(interventionId)
    .set(
      {
        interventionId,
        baseAmount,
        finalCommissionAmount,
        appliedRuleId,
        isManualOverride: false,
        overrideReason: null,
        overrideByUid: null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

  await db.collection("interventions").doc(interventionId).set(
    {
      commissionAmountCents,
      invoiceAmountCents,
    },
    { merge: true },
  );

  logger.info("Commission computed on invoiced", { interventionId, commissionAmountCents });
}
