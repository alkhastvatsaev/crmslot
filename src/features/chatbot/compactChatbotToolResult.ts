const MAX_TOOL_JSON_CHARS = 3_500;

const DETAIL_OMIT_KEYS = new Set([
  "audioTranscript",
  "transcript",
  "transcription",
  "rawTranscript",
  "completionReport",
  "reportCompletion",
  "media",
  "photos",
  "images",
  "attachments",
  "geolocation",
  "locationHistory",
  "twilioRecordingUrl",
  "recordingUrl",
  "audioUrl",
  "audioStoragePath",
  "embedding",
  "embeddings",
]);

function truncateStr(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function shallowOmitHeavy(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (DETAIL_OMIT_KEYS.has(k)) continue;
    if (typeof v === "string" && v.length > 800) {
      out[k] = truncateStr(v, 800);
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** Réponses courtes pour le modèle — évite le dépassement TPM. */
export function compactChatbotToolResult(toolName: string, result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  if ("error" in (result as object)) return result;

  const r = result as Record<string, unknown>;

  switch (toolName) {
    case "get_intervention_detail": {
      const timeline = Array.isArray(r.recentTimeline)
        ? (r.recentTimeline as Record<string, unknown>[]).slice(0, 5).map((e) => ({
            type: e.type,
            createdAt: e.createdAt,
            content: truncateStr(String(e.content ?? ""), 120),
          }))
        : [];
      return {
        id: r.id,
        status: r.status,
        clientName: r.clientName,
        address: r.address,
        problem: r.problem ?? r.title,
        scheduledDate: r.scheduledDate,
        scheduledTime: r.scheduledTime,
        paymentStatus: r.paymentStatus,
        invoiceAmountCents: r.invoiceAmountCents,
        billingLineCount: Array.isArray(r.billingLines) ? r.billingLines.length : 0,
        assignedTechnicianUid: r.assignedTechnicianUid,
        recentTimeline: timeline,
      };
    }
    case "get_intervention_billing": {
      const lines = Array.isArray(r.billingLines)
        ? (r.billingLines as Record<string, unknown>[]).map((l, i) => ({
            i,
            description: l.description,
            quantity: l.quantity,
            unitPriceEur: Math.round(Number(l.unitPriceCents ?? 0)) / 100,
          }))
        : [];
      return {
        interventionId: r.interventionId,
        clientName: r.clientName,
        totalEur: r.totalEur,
        paymentStatus: r.paymentStatus,
        lines,
      };
    }
    case "patch_intervention_billing":
    case "update_intervention_billing":
    case "append_intervention_billing_lines":
    case "focus_intervention_document":
      return {
        ok: r.ok,
        interventionId: r.interventionId,
        clientName: r.clientName,
        totalEur: r.totalEur,
        documentType: r.documentType ?? r.previewDocumentType,
        message: r.message,
        linePatched: r.linePatched,
        linesAdded: r.linesAdded,
        addedDescriptions: r.addedDescriptions,
      };
    case "search_lecot_products": {
      const products = Array.isArray(r.products)
        ? (r.products as Record<string, unknown>[]).slice(0, 8).map((p) => ({
            sku: p.sku,
            label: p.label,
            unitPriceEur: p.unitPriceEur,
          }))
        : [];
      const suggestions = Array.isArray(r.suggestions)
        ? (r.suggestions as Record<string, unknown>[]).slice(0, 3)
        : [];
      return {
        query: r.query,
        source: r.source,
        products,
        suggestions,
        instruction: r.instruction,
      };
    }
    case "order_lecot_parts":
      return {
        ok: true,
        supplierOrderId: r.supplierOrderId,
        status: r.status,
        totalCents: r.totalCents,
        totalEur: r.totalEur,
        lineCount: r.lineCount,
        lines: r.lines,
        demoMode: r.demoMode,
        demoReference: r.demoReference,
        materialOrderId: r.materialOrderId,
        interventionId: r.interventionId,
        billingSynced: r.billingSynced,
        lecot: r.lecot,
        message: r.message,
      };
    case "list_supplier_orders":
      return r;
    case "search_workspace":
    case "list_interventions":
      if (Array.isArray(result)) {
        return (result as unknown[]).slice(0, 25);
      }
      return result;
    case "list_portal_chat":
      if (Array.isArray(result)) {
        return (result as Record<string, unknown>[]).slice(-15).map((m) => ({
          role: m.role ?? m.sender,
          text: truncateStr(String(m.text ?? m.content ?? ""), 200),
          createdAt: m.createdAt,
        }));
      }
      return result;
    default:
      if (Array.isArray(result) && result.length > 30) {
        return result.slice(0, 30);
      }
      return shallowOmitHeavy(r);
  }
}

export function stringifyChatbotToolResult(toolName: string, result: unknown): string {
  const compact = compactChatbotToolResult(toolName, result);
  let json = JSON.stringify(compact);
  if (json.length > MAX_TOOL_JSON_CHARS) {
    json = `${json.slice(0, MAX_TOOL_JSON_CHARS - 40)},"_truncated":true}`;
  }
  return json;
}
