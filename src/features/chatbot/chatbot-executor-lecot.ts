import {
  orderLecotPartsForChatbot,
  searchLecotProductsForChatbot,
} from "@/features/chatbot/chatbot-lecot";
import { requireMaterialOrderClientName } from "@/features/materials/materialOrderClientName";
import {
  getGmailMessageForChatbot,
  linkGmailToIntervention,
  listGmailInboxForChatbot,
  sendGmailReplyFromChatbot,
  suggestGmailInterventionLinksForChatbot,
} from "@/features/chatbot/chatbot-gmail";
import { logCrmMaterialOrderApprovedAdmin } from "@/features/crmHistory/logCrmSupplierAndMaterialOrder";
import { db } from "@/features/chatbot/chatbot-executor-queries";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";

/** Texte de commande / navigation — jamais un nom de client réel. */
const LECOT_COMMAND_RE =
  /\b(nouvelle?\s*commande|commander|lecot|catalogue|stock|mati[eè]riel|materiel|recherche|rupture|articles?|sugg[eè]re|propose|montre|liste)\b/i;

function resolveOrderLecotClientName(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
): string {
  const fromInputRaw = typeof input.clientName === "string" ? input.clientName.trim() : "";
  // Rejette les hallucinations IA : textes de commande ne sont pas des noms clients.
  const fromInput =
    fromInputRaw && !LECOT_COMMAND_RE.test(fromInputRaw) && fromInputRaw.length <= 80
      ? fromInputRaw
      : "";
  const fromCtx = ctx.materialOrderClientName?.trim() ?? "";
  const name = fromInput || fromCtx;
  if (ctx.requireMaterialOrderClientName) {
    return requireMaterialOrderClientName(name);
  }
  return name;
}

export async function searchLecotProducts(companyId: string, input: Record<string, unknown>) {
  return searchLecotProductsForChatbot(
    companyId,
    String(input.query || ""),
    Number(input.limit) || 8
  );
}

export async function orderLecotParts(ctx: ChatbotToolContext, input: Record<string, unknown>) {
  const clientName = resolveOrderLecotClientName(ctx, input);
  return orderLecotPartsForChatbot(ctx, { ...input, clientName });
}

export async function approveMaterialOrders(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  const orderIds = Array.isArray(input.orderIds)
    ? input.orderIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const approveAll = input.approveAllPending === true;
  const firestore = db();
  const approved: string[] = [];
  const skipped: string[] = [];

  if (approveAll) {
    const snap = await firestore
      .collection("material_orders")
      .where("companyId", "==", ctx.companyId)
      .limit(60)
      .get();
    for (const doc of snap.docs) {
      if (approved.length >= 15) break;
      const data = doc.data();
      if (data.status !== "pending") {
        skipped.push(doc.id);
        continue;
      }
      await doc.ref.update({ status: "ordered", updatedAt: new Date().toISOString() });
      approved.push(doc.id);
      void logCrmMaterialOrderApprovedAdmin({
        companyId: ctx.companyId,
        actorUid: ctx.actorUid,
        role: ctx.role,
        materialOrderId: doc.id,
        interventionId: typeof data.interventionId === "string" ? data.interventionId : null,
        clientName: typeof data.clientName === "string" ? data.clientName : null,
      });
    }
    return {
      ok: true,
      approved,
      skipped: skipped.length,
      message: `${approved.length} demande(s) validée(s).`,
    };
  }

  for (const orderId of orderIds.slice(0, 15)) {
    const ref = firestore.collection("material_orders").doc(orderId);
    const doc = await ref.get();
    if (!doc.exists) {
      skipped.push(orderId);
      continue;
    }
    const data = doc.data()!;
    if (String(data.companyId || "") !== ctx.companyId) {
      throw new Error("Bon matériel hors société active");
    }
    if (data.status !== "pending") {
      skipped.push(orderId);
      continue;
    }
    await ref.update({ status: "ordered", updatedAt: new Date().toISOString() });
    approved.push(orderId);
    void logCrmMaterialOrderApprovedAdmin({
      companyId: ctx.companyId,
      actorUid: ctx.actorUid,
      role: ctx.role,
      materialOrderId: orderId,
      interventionId: typeof data.interventionId === "string" ? data.interventionId : null,
      clientName: typeof data.clientName === "string" ? data.clientName : null,
    });
  }

  return {
    ok: true,
    approved,
    skipped,
    message:
      approved.length > 0
        ? `${approved.length} demande(s) passée(s) en commandé.`
        : "Aucune demande pending à valider.",
  };
}

export async function listGmailInbox(input: Record<string, unknown>) {
  return listGmailInboxForChatbot({
    q: String(input.q || ""),
    labelId: String(input.labelId || ""),
    limit: Number(input.limit) || 12,
    unreadOnly: Boolean(input.unreadOnly),
  });
}

export async function getGmailMessage(input: Record<string, unknown>) {
  return getGmailMessageForChatbot(String(input.messageId || ""));
}

export async function suggestGmailInterventionLinks(
  companyId: string,
  input: Record<string, unknown>
) {
  return suggestGmailInterventionLinksForChatbot(companyId, {
    messageId: String(input.messageId || ""),
  });
}

export async function sendGmailReply(input: Record<string, unknown>) {
  return sendGmailReplyFromChatbot(
    input as { messageId: string; bodyText: string; to?: string; subject?: string }
  );
}

export async function linkGmailToInterventionHandler(
  ctx: ChatbotToolContext,
  input: Record<string, unknown>
) {
  return linkGmailToIntervention(
    ctx,
    input as { messageId: string; interventionId: string; note?: string }
  );
}
