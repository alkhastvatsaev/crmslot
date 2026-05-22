import * as admin from "firebase-admin";
import type { Intervention } from "@/features/interventions/types";
import { isChatbotWriteTool } from "@/features/chatbot/chatbot-tools";
import type { ChatbotToolContext } from "@/features/chatbot/chatbot-tool-executor";
import {
  buildCompanyCrmActivityPayload,
  type CompanyCrmActivityKind,
} from "./crmActivityLog";
import { logCompanyCrmActivityAdmin } from "./logCompanyCrmActivityAdmin";
import type { WorkflowOwnerRole } from "@/features/interventions/workflow/interventionWorkflowTypes";

const BILLING_TOOLS = new Set([
  "patch_intervention_billing",
  "update_intervention_billing",
  "append_intervention_billing_lines",
]);

const TOOL_KIND: Record<string, CompanyCrmActivityKind> = {
  patch_intervention_billing: "intervention_billing_updated",
  update_intervention_billing: "intervention_billing_updated",
  append_intervention_billing_lines: "intervention_billing_updated",
  order_lecot_parts: "supplier_order_lecot",
  update_intervention_status: "chatbot_intervention_status",
  assign_technician: "intervention_assigned",
  update_intervention_schedule: "intervention_schedule_updated",
  add_timeline_comment: "chatbot_timeline_comment",
  send_intervention_email: "chatbot_email_sent",
  send_gmail_reply: "chatbot_gmail_action",
  link_gmail_to_intervention: "chatbot_gmail_action",
};

const TOOL_LABELS: Record<string, string> = {
  patch_intervention_billing: "Facturation (patch)",
  update_intervention_billing: "Facturation (remplacement lignes)",
  append_intervention_billing_lines: "Facturation (lignes ajoutées)",
  order_lecot_parts: "Commande fournisseur Lecot",
  update_intervention_status: "Statut modifié (chatbot)",
  assign_technician: "Technicien assigné (chatbot)",
  update_intervention_schedule: "Planning modifié (chatbot)",
  add_timeline_comment: "Commentaire timeline",
  send_intervention_email: "Email intervention envoyé",
  send_gmail_reply: "Réponse Gmail",
  link_gmail_to_intervention: "Email lié au dossier",
};

function db(): admin.firestore.Firestore {
  if (!admin.apps.length) throw new Error("Firebase Admin non initialisé");
  return admin.firestore();
}

function chatbotActorRole(ctx: ChatbotToolContext): WorkflowOwnerRole {
  return ctx.role === "admin" || ctx.role === "collaborateur" ? "dispatcher" : "dispatcher";
}

function toolSucceeded(result: unknown): boolean {
  if (result === null || result === undefined) return false;
  if (typeof result !== "object") return true;
  const r = result as Record<string, unknown>;
  if (r.ok === false) return false;
  if (typeof r.error === "string" && r.error.trim()) return false;
  return true;
}

function extractInterventionId(
  input: Record<string, unknown>,
  result: unknown,
): string {
  const fromInput = String(input.interventionId || "").trim();
  if (fromInput) return fromInput;
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    const fromResult = String(r.interventionId || "").trim();
    if (fromResult) return fromResult;
  }
  return "";
}

function buildNote(name: string, input: Record<string, unknown>, result: unknown): string {
  const parts = [`Chatbot · ${TOOL_LABELS[name] ?? name}`];

  if (BILLING_TOOLS.has(name) && result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    const docKind = String(input.previewDocumentType || r.previewDocumentType || "invoice");
    if (docKind === "invoice") parts[0] = "Chatbot · Facture enregistrée";
    if (typeof r.totalEur === "number") parts.push(`${r.totalEur} €`);
    if (typeof r.linesAdded === "number") parts.push(`+${r.linesAdded} ligne(s)`);
  }

  if (name === "order_lecot_parts" && result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (typeof r.totalEur === "number") parts.push(`${r.totalEur} € HT`);
    if (typeof r.supplierOrderId === "string") parts.push(`#${r.supplierOrderId.slice(0, 8)}`);
    if (r.demoMode) parts.push("(démo)");
  }

  if (name === "update_intervention_status") {
    const st = String(input.status || "").trim();
    if (st) parts.push(`→ ${st}`);
    const note = String(input.note || "").trim();
    if (note) parts.push(note);
  }

  if (name === "assign_technician") {
    const tech = String(input.technicianUid || "").trim();
    if (tech) parts.push(tech.slice(0, 12));
  }

  if (name === "update_intervention_schedule") {
    const d = String(input.scheduledDate || input.requestedDate || "").trim();
    const t = String(input.scheduledTime || input.requestedTime || "").trim();
    if (d || t) parts.push([d, t].filter(Boolean).join(" "));
  }

  if (name === "add_timeline_comment") {
    const c = String(input.content || input.comment || "").trim();
    if (c) parts.push(c.slice(0, 80));
  }

  if (name === "send_intervention_email") {
    const subj = String(input.subject || "").trim();
    if (subj) parts.push(subj.slice(0, 60));
  }

  return parts.join(" · ");
}

async function interventionPickForLog(
  companyId: string,
  interventionId: string,
): Promise<{
  id: string;
  title?: string;
  address?: string;
  status?: string;
  clientName?: string;
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientCompanyName?: string | null;
} | null> {
  const snap = await db().collection("interventions").doc(interventionId).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  if (String(data.companyId ?? "").trim() !== companyId.trim()) return null;
  return {
    id: snap.id,
    title: typeof data.title === "string" ? data.title : undefined,
    address: typeof data.address === "string" ? data.address : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    clientName: typeof data.clientName === "string" ? data.clientName : undefined,
    clientFirstName: typeof data.clientFirstName === "string" ? data.clientFirstName : null,
    clientLastName: typeof data.clientLastName === "string" ? data.clientLastName : null,
    clientCompanyName:
      typeof data.clientCompanyName === "string" ? data.clientCompanyName : null,
  };
}

/** Journal CRM après un outil chatbot d’écriture réussi. */
export async function logCrmFromChatbotTool(
  name: string,
  input: Record<string, unknown>,
  result: unknown,
  ctx: ChatbotToolContext,
): Promise<void> {
  const isBillingAppend = name === "append_intervention_billing_lines";
  if (!isChatbotWriteTool(name) && !isBillingAppend) return;
  if (!toolSucceeded(result)) return;

  const kind = TOOL_KIND[name] ?? "chatbot_write_action";
  const interventionId = extractInterventionId(input, result);
  const note = buildNote(name, input, result);

  const iv = interventionId
    ? await interventionPickForLog(ctx.companyId, interventionId)
    : null;

  const statusAfter =
    name === "update_intervention_status"
      ? (String(input.status || "").trim() as Intervention["status"]) || undefined
      : undefined;

  const payload = buildCompanyCrmActivityPayload(
    ctx.companyId,
    kind,
    { uid: ctx.actorUid, role: chatbotActorRole(ctx) },
    iv
      ? {
          id: iv.id,
          title: iv.title ?? "Dossier",
          address: iv.address ?? "",
          status: (iv.status as Intervention["status"]) ?? "pending",
          clientName: iv.clientName,
          clientFirstName: iv.clientFirstName,
          clientLastName: iv.clientLastName,
          clientCompanyName: iv.clientCompanyName,
        }
      : {
          id: interventionId || "—",
          title: "Action chatbot",
          address: "",
          status: "pending",
        },
    {
      statusAfter,
      note,
    },
  );

  try {
    await logCompanyCrmActivityAdmin(db(), payload);
  } catch (e) {
    console.warn("[logCrmFromChatbotTool]", name, e);
  }
}
