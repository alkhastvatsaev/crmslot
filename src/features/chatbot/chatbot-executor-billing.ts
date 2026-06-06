import {
  applyBillingLinePatch,
  billingLinesTotalCents,
  normalizeBillingLinesFromFirestore,
  parseUnitPriceCents,
  type ChatbotBillingLine,
} from "@/features/chatbot/chatbot-billing";
import {
  isChatbotDocumentKind,
  type ChatbotDocumentKind,
} from "@/features/chatbot/chatbot-document";
import { clientNameFirestorePatchIfMissing } from "@/features/interventions/resolveInterventionClientName";
import {
  db,
  clientLabel,
  assertInterventionAccess,
} from "@/features/chatbot/chatbot-executor-queries";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";

async function saveInterventionBilling(
  ctx: ChatbotToolContext,
  interventionId: string,
  data: Record<string, unknown>,
  billingLines: ChatbotBillingLine[],
  previewDocumentType: ChatbotDocumentKind,
  clientNameOverride?: string
) {
  const totalCents = billingLinesTotalCents(billingLines);
  const namePatch = clientNameFirestorePatchIfMissing(data, clientNameOverride);

  await db()
    .collection("interventions")
    .doc(interventionId)
    .update({
      billingLines,
      invoiceAmountCents: totalCents,
      statusUpdatedAt: new Date().toISOString(),
      ...(namePatch ?? {}),
    });

  const clientName =
    namePatch?.clientName ??
    clientNameOverride ??
    (typeof data.clientName === "string" && data.clientName.trim()
      ? data.clientName.trim()
      : clientLabel(data));

  return {
    ok: true,
    interventionId,
    clientName,
    totalEur: totalCents / 100,
    previewDocumentType,
    documentType: previewDocumentType,
    message: "Facturation enregistrée.",
  };
}

export async function updateInterventionBilling(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const interventionId = String(input.interventionId || "").trim();
  if (!interventionId) throw new Error("interventionId requis");

  const rawLines = input.billingLines;
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new Error("billingLines requis (au moins une ligne)");
  }

  const billingLines = rawLines.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`Ligne ${i + 1} invalide`);
    const l = row as Record<string, unknown>;
    const description = String(l.description || "").trim();
    const quantity = Number(l.quantity);
    const unitPriceCents = parseUnitPriceCents(l) ?? Math.round(Number(l.unitPriceCents));
    if (!description) throw new Error(`Ligne ${i + 1} : description requise`);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Ligne ${i + 1} : quantité invalide`);
    }
    if (!Number.isFinite(unitPriceCents) || unitPriceCents < 0) {
      throw new Error(`Ligne ${i + 1} : prix unitaire invalide`);
    }
    return {
      description,
      quantity,
      unitPriceCents,
      ...(typeof l.reference === "string" && l.reference.trim()
        ? { reference: l.reference.trim() }
        : {}),
    };
  });

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;

  let previewDocumentType: ChatbotDocumentKind = "invoice";
  const pdt = String(input.previewDocumentType || "invoice").trim();
  if (isChatbotDocumentKind(pdt) && pdt !== "report") previewDocumentType = pdt;

  const clientOverride =
    typeof input.clientName === "string" && input.clientName.trim()
      ? input.clientName.trim()
      : undefined;

  const saved = await saveInterventionBilling(
    ctx,
    interventionId,
    data,
    billingLines,
    previewDocumentType,
    clientOverride
  );

  if (typeof input.clientAddress === "string" && input.clientAddress.trim()) {
    await db()
      .collection("interventions")
      .doc(interventionId)
      .update({ address: input.clientAddress.trim() });
  }

  return saved;
}

export async function patchInterventionBilling(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const interventionId = String(input.interventionId || "").trim();
  if (!interventionId) throw new Error("interventionId requis");

  const unitPriceCents = parseUnitPriceCents(input);
  const hasPrice = unitPriceCents != null;
  const hasDesc = typeof input.description === "string" && input.description.trim();
  const hasQty = input.quantity != null && Number.isFinite(Number(input.quantity));
  const hasClient = typeof input.clientName === "string" && input.clientName.trim();

  if (!hasPrice && !hasDesc && !hasQty && !hasClient) {
    throw new Error(
      "Précisez au moins unitPriceEur, description, quantity ou clientName pour le patch."
    );
  }

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;
  const existing = normalizeBillingLinesFromFirestore(data.billingLines);
  const lineIndex = Math.max(0, Number(input.lineIndex) || 0);

  const billingLines = applyBillingLinePatch(existing, {
    lineIndex,
    unitPriceCents: hasPrice ? unitPriceCents : null,
    quantity: hasQty ? Number(input.quantity) : undefined,
    description: hasDesc ? String(input.description).trim() : undefined,
  });

  let previewDocumentType: ChatbotDocumentKind = "invoice";
  const pdt = String(input.previewDocumentType || "invoice").trim();
  if (isChatbotDocumentKind(pdt) && pdt !== "report") previewDocumentType = pdt;

  const saved = await saveInterventionBilling(
    ctx,
    interventionId,
    data,
    billingLines,
    previewDocumentType,
    hasClient ? String(input.clientName).trim() : undefined
  );
  return { ...saved, linePatched: lineIndex };
}

export async function appendInterventionBillingLines(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const interventionId = String(input.interventionId || "").trim();
  if (!interventionId) throw new Error("interventionId requis");

  const rawLines = input.lines;
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new Error("lines requis (au moins une ligne)");
  }

  const newLines = rawLines.map((row, i) => {
    if (!row || typeof row !== "object") throw new Error(`Ligne ${i + 1} invalide`);
    const l = row as Record<string, unknown>;
    const description = String(l.description || "").trim();
    const quantity = l.quantity != null ? Number(l.quantity) : 1;
    const unitPriceCents = parseUnitPriceCents(l);
    if (!description) throw new Error(`Ligne ${i + 1} : description requise`);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Ligne ${i + 1} : quantité invalide`);
    }
    if (unitPriceCents == null || unitPriceCents < 0) {
      throw new Error(`Ligne ${i + 1} : prix invalide`);
    }
    return { description, quantity, unitPriceCents };
  });

  const doc = await assertInterventionAccess(ctx.companyId, interventionId);
  const data = doc.data()!;
  const existing = normalizeBillingLinesFromFirestore(data.billingLines);
  const billingLines = [...existing, ...newLines];

  let previewDocumentType: ChatbotDocumentKind = "invoice";
  const pdt = String(input.previewDocumentType || "invoice").trim();
  if (isChatbotDocumentKind(pdt) && pdt !== "report") previewDocumentType = pdt;

  const saved = await saveInterventionBilling(
    ctx,
    interventionId,
    data,
    billingLines,
    previewDocumentType
  );
  return {
    ...saved,
    linesAdded: newLines.length,
    addedDescriptions: newLines.map((l) => l.description),
  };
}

export async function focusInterventionDocument(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const interventionId = String(input.interventionId || "").trim();
  const documentType = String(input.documentType || "invoice").trim();
  if (!interventionId) throw new Error("interventionId requis");
  if (!isChatbotDocumentKind(documentType)) {
    throw new Error("documentType invalide (quote | invoice | report)");
  }
  await assertInterventionAccess(ctx.companyId, interventionId);
  return {
    ok: true,
    interventionId,
    documentType,
  };
}

export function focusBillingCaseUi(input: Record<string, unknown>) {
  return {
    ok: true,
    ui: "focus_billing",
    interventionId:
      typeof input.interventionId === "string" ? input.interventionId.trim() || null : null,
    filter: typeof input.filter === "string" ? input.filter.trim() || null : null,
  };
}

export function focusStockItemUi(input: Record<string, unknown>) {
  const filter = typeof input.filter === "string" ? input.filter.trim() : null;
  return {
    ok: true,
    ui: "focus_stock",
    stockItemId: typeof input.stockItemId === "string" ? input.stockItemId.trim() || null : null,
    filter: filter || null,
    searchQuery: typeof input.searchQuery === "string" ? input.searchQuery.trim() || null : null,
  };
}

export function openCrmDossierUi(input: Record<string, unknown>) {
  const interventionId = String(input.interventionId || "").trim();
  if (!interventionId) throw new Error("interventionId requis");
  return { ok: true, ui: "open_crm", interventionId };
}
