import { NextRequest } from "next/server";
import OpenAI from "openai";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

type ChatMessage = { role: "user" | "assistant"; content: string };

function safeDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "object" && val !== null && "seconds" in val) {
    return new Date((val as { seconds: number }).seconds * 1000);
  }
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function fmt(d: Date | null) {
  return d ? d.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const body = await req.json() as { message?: string; companyId?: string; history?: ChatMessage[] };
  const { message, companyId, history = [] } = body;

  if (!message?.trim() || !companyId) {
    return new Response(JSON.stringify({ error: "message + companyId requis" }), { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      "⚠️ OPENAI_API_KEY non configurée. Ajoutez-la dans vos variables d'environnement.",
      { headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const db = admin.firestore();
  const today = new Date().toISOString().slice(0, 10);

  const [ivSnap, techSnap, stockSnap] = await Promise.allSettled([
    db.collection("interventions")
      .where("companyId", "==", companyId)
      .orderBy("createdAt", "desc")
      .limit(120)
      .get(),
    db.collection("technicians")
      .where("companyId", "==", companyId)
      .limit(30)
      .get(),
    db.collection("stock_items")
      .where("companyId", "==", companyId)
      .limit(50)
      .get(),
  ]);

  type IvData = Record<string, unknown>;
  const interventions: IvData[] =
    ivSnap.status === "fulfilled"
      ? ivSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }))
      : [];

  type TechData = Record<string, unknown>;
  const technicians: TechData[] =
    techSnap.status === "fulfilled"
      ? techSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }))
      : [];

  type StockData = Record<string, unknown>;
  const stockItems: StockData[] =
    stockSnap.status === "fulfilled"
      ? stockSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }))
      : [];

  const todayIvs = interventions.filter(
    (iv) => iv.scheduledDate === today || iv.requestedDate === today,
  );
  const pending = interventions.filter((iv) => ["pending"].includes(String(iv.status)));
  const assigned = interventions.filter((iv) => ["assigned", "en_route", "in_progress", "waiting_material"].includes(String(iv.status)));
  const done = interventions.filter((iv) => String(iv.status) === "done");
  const invoiced = interventions.filter((iv) => String(iv.status) === "invoiced");

  const totalRevenue = interventions.reduce((sum, iv) => {
    const lines = Array.isArray(iv.billingLines) ? iv.billingLines as Array<{ unitPriceCents?: number; quantity?: number }> : [];
    return sum + lines.reduce((s, l) => s + ((l.unitPriceCents ?? 0) * (l.quantity ?? 1)) / 100, 0);
  }, 0);

  const lowStock = stockItems.filter(
    (s) => typeof s.quantity === "number" && typeof s.alertThreshold === "number" && s.quantity <= s.alertThreshold,
  );

  const ivLine = (iv: IvData) => {
    const d = fmt(safeDate(iv.createdAt));
    const client = String(iv.clientCompanyName || iv.clientLastName || iv.clientName || "Client");
    const addr = String(iv.address || "").split(",")[0];
    const prob = String(iv.problem || iv.title || "").slice(0, 60);
    const tech = String(iv.assignedTechnicianUid || "non assigné").slice(-8);
    return `[${iv.status}] ${d} | ${client} | ${addr} | ${prob} | tech:${tech}`;
  };

  const systemPrompt = `Tu es l'assistant IA de BELGMAP — un logiciel de gestion d'interventions terrain (plomberie, électricité, etc.).
Tu as accès en temps réel aux données de l'entreprise. Réponds toujours en français, de façon concise et utile.
Date du jour : ${today}

━━━ TECHNICIENS (${technicians.length}) ━━━
${technicians.map((t) => `• ${String(t.name || t.displayName || t.email || t.uid || t.id)} | uid:${String(t.uid || t.id).slice(-8)}`).join("\n") || "Aucun"}

━━━ CHIFFRES CLÉS ━━━
Total interventions (120 dernières) : ${interventions.length}
  • En attente (pending) : ${pending.length}
  • Assignées/En cours : ${assigned.length}
  • Terminées (done) : ${done.length}
  • Facturées : ${invoiced.length}
Aujourd'hui (${today}) : ${todayIvs.length} intervention(s)
Chiffre d'affaires estimé (lignes billing) : ${totalRevenue.toFixed(2)} €
Stock bas (alertes) : ${lowStock.length} article(s)

━━━ AUJOURD'HUI (${todayIvs.length}) ━━━
${todayIvs.slice(0, 15).map(ivLine).join("\n") || "Aucune"}

━━━ EN COURS / ASSIGNÉES (${assigned.length}) ━━━
${assigned.slice(0, 10).map(ivLine).join("\n") || "Aucune"}

━━━ EN ATTENTE (${pending.length}) ━━━
${pending.slice(0, 10).map(ivLine).join("\n") || "Aucune"}

━━━ 20 DERNIÈRES INTERVENTIONS ━━━
${interventions.slice(0, 20).map(ivLine).join("\n")}

━━━ STOCK BAS ━━━
${lowStock.map((s) => `• ${s.name || s.id} : ${s.quantity} ${s.unit || "u"} (seuil: ${s.alertThreshold})`).join("\n") || "Aucun article en alerte"}

━━━ INSTRUCTIONS ━━━
- Si on te demande un résumé de la journée, liste les interventions du jour.
- Si on te demande qui travaille sur quoi, croise les techniciens et les interventions.
- Si on te demande le CA, utilise les billingLines.
- Réponds de façon structurée avec des tirets ou tableaux simples si pertinent.
- Ne révèle pas les IDs Firebase complets.`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    stream: true,
    max_tokens: 900,
    temperature: 0.25,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
