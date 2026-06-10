import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import OpenAI from "openai";
import { logger } from "@/core/logger";

// Assurez-vous d'avoir OPENAI_API_KEY dans votre .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages, companyId } = await req.json();

    if (!messages || !Array.isArray(messages) || !companyId) {
      return NextResponse.json({ error: "Missing messages or companyId" }, { status: 400 });
    }

    const db = getAdminDb();

    // 1. Fetch Company Context (RAG)
    const contextLines: string[] = [];
    contextLines.push(`Contexte de l'entreprise (ID: ${companyId}):`);

    try {
      // Fetch recent interventions (last 10)
      const interventionsSnap = await db
        .collection("interventions")
        .where("companyId", "==", companyId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      contextLines.push(`\n[Interventions Récentes] (${interventionsSnap.size}):`);
      interventionsSnap.forEach((doc) => {
        const data = doc.data();
        contextLines.push(
          `- ID: ${doc.id} | Titre: ${data.title || "N/A"} | Client: ${data.clientName || "N/A"} | Statut: ${data.status} | Urgence: ${data.urgency || "normale"} | Date: ${data.createdAt}`
        );
      });

      // Fetch recent clients
      const clientsSnap = await db
        .collection("clients")
        .where("companyId", "==", companyId)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      contextLines.push(`\n[Clients Récents] (${clientsSnap.size}):`);
      clientsSnap.forEach((doc) => {
        const data = doc.data();
        contextLines.push(
          `- ID: ${doc.id} | Nom: ${data.name || data.email} | Téléphone: ${data.phone || "N/A"}`
        );
      });

      // Fetch quotes
      const quotesSnap = await db
        .collection("companies")
        .doc(companyId)
        .collection("quotes")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      contextLines.push(`\n[Devis Récents] (${quotesSnap.size}):`);
      quotesSnap.forEach((doc) => {
        const data = doc.data();
        contextLines.push(
          `- ID: ${doc.id} | Titre: ${data.title} | Montant: ${data.totalTTC || 0}€ | Statut: ${data.status}`
        );
      });
    } catch (dbErr) {
      logger.warn("Erreur RAG Firestore:", {
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
      contextLines.push(
        "\n[Avertissement: Impossible de récupérer toutes les données en temps réel]"
      );
    }

    const systemPrompt = `Tu es l'assistant IA omniscient et expert de Belgmap pour la gestion de cette entreprise. 
Ton rôle est de répondre aux questions de l'utilisateur de manière concise, professionnelle, et très rapide.
Tu as accès aux données en temps réel de la PWA. Utilise les informations suivantes pour répondre aux requêtes. Ne mentionne pas que tu as un bloc de "Contexte", comporte-toi simplement comme si tu connaissais l'état actuel de l'entreprise.
Si on te pose une question sur un élément qui n'est pas dans le contexte, précise que tu ne vois que les éléments les plus récents.

${contextLines.join("\n")}`;

    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    ];

    // 2. Stream from OpenAI
    const responseStream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      stream: true,
      temperature: 0.3,
      max_tokens: 1000,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            controller.enqueue(new TextEncoder().encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    logger.error("Erreur API Chat AI:", {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
