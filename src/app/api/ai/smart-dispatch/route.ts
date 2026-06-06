import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { logger } from "@/core/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    // 1. Authentification
    const authResult = await requireAuthenticatedUser(req);
    if ("response" in authResult) return authResult.response;

    const body = await req.json();
    const { problem, address, technicians } = body;

    if (!technicians || !Array.isArray(technicians) || technicians.length === 0) {
      return NextResponse.json({ error: "No technicians provided" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Fallback si pas de clé API (pour éviter de casser l'app)
      return NextResponse.json({
        bestTechnicianId: technicians[0].id,
        reasoning:
          "API OpenAI non configurée. Recommandation basée sur le temps de trajet estimé par défaut.",
      });
    }

    type DispatchTech = {
      id: string;
      name?: string;
      skills?: string[];
      realEta?: string;
      status?: string;
    };
    const techList = (technicians as DispatchTech[]).map((t) => ({
      id: t.id,
      name: t.name,
      skills: t.skills,
      eta: t.realEta || "Inconnu",
      status: t.status,
    }));

    const systemPrompt = `Tu es un assistant IA spécialisé dans la répartition des interventions techniques (dispatch).
Ta mission est de choisir le MEILLEUR technicien pour une intervention donnée.
Critères de décision (par ordre d'importance) :
1. Temps de trajet (ETA) : le technicien doit arriver le plus vite possible.
2. Compétences (skills) : le technicien doit idéalement avoir les compétences adaptées au problème.
3. Statut : privilégier les techniciens "available".

Tu recevras :
- Le problème : La description du problème chez le client.
- L'adresse du client.
- Les techniciens : Une liste des techniciens les plus proches avec leurs infos.

Tu DOIS retourner un objet JSON avec exactement cette structure :
{
  "bestTechnicianId": "id_du_technicien_choisi",
  "reasoning": "Une phrase courte (max 20 mots) expliquant de manière professionnelle pourquoi ce technicien est idéal pour cette tâche."
}`;

    const userPrompt = `Problème : ${problem || "Non précisé"}
Adresse : ${address || "Non précisée"}
Techniciens disponibles :
${JSON.stringify(techList, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);

    // Vérifier que le technicien choisi fait bien partie de la liste
    const chosen = (technicians as DispatchTech[]).find((t) => t.id === result.bestTechnicianId);
    if (!chosen) {
      result.bestTechnicianId = technicians[0].id;
      result.reasoning = "Le système a choisi ce technicien par défaut suite à une anomalie.";
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[smart-dispatch]", {
      error: error instanceof Error ? error.message : String(error),
    });
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Erreur interne", details: message }, { status: 500 });
  }
}
