import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { getClient } from "@/core/services/audio/transcription";
import type {
  WorkspaceCopilotApiMessage,
  WorkspaceCopilotSnapshot,
} from "@/features/copilot/types";

export const runtime = "nodejs";

const MAX_MESSAGES = 24;
const MAX_USER_CHARS = 4000;

function buildSystemPrompt(snapshot: WorkspaceCopilotSnapshot): string {
  const lang =
    snapshot.locale === "en" ? "English" : snapshot.locale === "nl" ? "Dutch" : "French";

  return `You are BELGMAP Copilot, the integrated AI assistant inside the BELGMAP field-service PWA (locksmith / technical interventions).

You receive a JSON snapshot of the active company workspace: clients, interventions (dossiers), statuses, billing/payment hints, offline queue size, and network state. This snapshot is the source of truth for factual answers about "what is happening" in the app.

Rules:
- Answer in ${lang} unless the user writes in another language (then mirror their language).
- Be concise, actionable, and professional (dispatcher / back-office tone).
- When citing dossiers, include intervention id and client name when relevant.
- For counts and statuses, use only the snapshot data — do not invent dossiers or amounts.
- If data is missing or the question needs live data not in the snapshot, say so clearly and suggest what to check in the app.
- You may summarize priorities (urgent, unassigned, unpaid), suggest next actions, draft client messages, or explain billing status — always grounded in the snapshot.
- Never reveal API keys or internal implementation details.

Snapshot JSON (refresh each turn):
${JSON.stringify(snapshot)}`;
}

function sanitizeMessages(raw: unknown): WorkspaceCopilotApiMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: WorkspaceCopilotApiMessage[] = [];
  for (const item of raw.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const trimmed = content.trim().slice(0, MAX_USER_CHARS);
    if (!trimmed) continue;
    out.push({ role, content: trimmed });
  }
  return out.length > 0 ? out : null;
}

function isValidSnapshot(raw: unknown): raw is WorkspaceCopilotSnapshot {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as WorkspaceCopilotSnapshot;
  return typeof s.generatedAt === "string" && typeof s.company?.id === "string" && Boolean(s.company.id.trim());
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json().catch(() => null)) as {
      messages?: unknown;
      snapshot?: unknown;
    } | null;

    const messages = sanitizeMessages(body?.messages);
    if (!messages) {
      return NextResponse.json({ error: "messages invalides" }, { status: 400 });
    }
    if (!isValidSnapshot(body?.snapshot)) {
      return NextResponse.json({ error: "snapshot manquant" }, { status: 400 });
    }

    const snapshot = body.snapshot as WorkspaceCopilotSnapshot;
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({
        reply:
          snapshot.locale === "en"
            ? "OpenAI is not configured on this server. Add OPENAI_API_KEY to enable the copilot."
            : snapshot.locale === "nl"
              ? "OpenAI is niet geconfigureerd op deze server. Voeg OPENAI_API_KEY toe."
              : "OpenAI n’est pas configuré sur ce serveur. Ajoutez OPENAI_API_KEY pour activer le copilot.",
        configured: false,
      });
    }

    const model = process.env.OPENAI_DISPATCH_MODEL?.trim() || "gpt-4o-mini";
    const client = getClient();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.35,
      max_tokens: 900,
      messages: [
        { role: "system", content: buildSystemPrompt(snapshot) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "réponse vide" }, { status: 502 });
    }

    return NextResponse.json({ reply, configured: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    console.error("[workspace-copilot]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
