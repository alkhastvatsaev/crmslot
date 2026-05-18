import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { buildChatbotSystemPrompt } from "@/features/chatbot/chatbot-system-prompt";
import { isWorkspaceCopilotSnapshot } from "@/features/chatbot/chatbot-snapshot-prompt";
import { executeChatbotTool } from "@/features/chatbot/chatbot-tool-executor";
import { runChatbotOpenAI } from "@/features/chatbot/chatbot-openai";
import type { CompanyRole } from "@/features/company/types";

export const runtime = "nodejs";

function sseLine(obj: unknown): string {
  return `${JSON.stringify(obj)}\n`;
}

function resolveOpenAIApiKey(): string {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const body = (await req.json().catch(() => null)) as {
    companyId?: string;
    companyName?: string;
    role?: CompanyRole | null;
    messages?: unknown[];
    workspaceSnapshot?: unknown;
    confirmTool?: {
      toolUseId?: string;
      name?: string;
      input?: Record<string, unknown>;
    };
  } | null;

  const companyId = (body?.companyId ?? "").trim();
  const companyName = (body?.companyName ?? "Société").trim() || "Société";
  const role = body?.role ?? null;
  let messages = Array.isArray(body?.messages) ? [...body!.messages!] : [];

  if (body?.confirmTool?.name) {
    const input = { ...(body.confirmTool.input ?? {}), userConfirmed: true };
    const result = await executeChatbotTool(body.confirmTool.name, input, {
      companyId,
      actorUid: authResult.uid,
      role,
    }).catch((err: unknown) => ({
      error: err instanceof Error ? err.message : "Erreur",
    }));
    messages = [
      ...messages,
      {
        role: "tool",
        tool_call_id: body.confirmTool.toolUseId ?? body.confirmTool.name,
        content: JSON.stringify(result),
      },
    ];
  }

  if (!companyId) {
    return new Response(JSON.stringify({ error: "companyId requis" }), { status: 400 });
  }
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages requis" }), { status: 400 });
  }

  const openAIKey = resolveOpenAIApiKey();
  if (!openAIKey) {
    return new Response(
      sseLine({
        type: "error",
        message:
          "OPENAI_API_KEY manquante. Ajoutez-la dans .env.local.",
      }),
      { headers: { "Content-Type": "text/event-stream; charset=utf-8" } },
    );
  }

  const modelName = process.env.OPENAI_MODEL?.trim() || "gpt-4o";
  const today = new Date().toISOString().slice(0, 10);
  const workspaceSnapshot = isWorkspaceCopilotSnapshot(body?.workspaceSnapshot)
    ? body.workspaceSnapshot
    : null;
  const system = buildChatbotSystemPrompt({
    companyName,
    companyId,
    role,
    today,
    workspaceSnapshot,
  });
  const toolCtx = { companyId, actorUid: authResult.uid, role };

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (ev: unknown) => controller.enqueue(encoder.encode(sseLine(ev)));

      try {
        const result = await runChatbotOpenAI({
          apiKey: openAIKey,
          modelName,
          system,
          messages,
          toolCtx,
          emit: (ev) => enqueue(ev),
        });

        if (result.status === "pending") {
          enqueue({ type: "tool_pending", pending: result.pending });
          enqueue({ type: "done", apiMessages: result.apiMessages });
        } else {
          enqueue({ type: "done", apiMessages: result.apiMessages });
        }
        controller.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erreur Chatbot";
        console.error("[chatbot/openai]", error);
        enqueue({ type: "error", message });
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
