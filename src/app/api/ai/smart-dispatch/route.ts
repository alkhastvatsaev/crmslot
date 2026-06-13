import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

type DispatchTech = {
  id: string;
  name?: string;
  skills?: string[];
  realEta?: string;
  status?: string;
  /** Score de performance composite 0–100 (optionnel — enrichi côté client). */
  performanceScore?: number;
  /** Taux de clôture 30j en % (optionnel). */
  completionRate?: number;
  /** Ticket moyen facturé 30j en € (optionnel). */
  avgTicketEur?: number;
};

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser(req);
    if ("response" in authResult) return authResult.response;

    const body = await req.json();
    const { problem, address, technicians, urgency } = body as {
      problem?: string;
      address?: string;
      technicians: DispatchTech[];
      urgency?: string;
    };

    if (!technicians || !Array.isArray(technicians) || technicians.length === 0) {
      return NextResponse.json({ error: "No technicians provided" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        bestTechnicianId: technicians[0]!.id,
        reasoning: "API OpenAI non configurée — recommandation par défaut.",
      });
    }

    const hasPerformanceData = technicians.some((t) => t.performanceScore !== undefined);

    const techList = technicians.map((t) => ({
      id: t.id,
      name: t.name,
      skills: t.skills ?? [],
      eta: t.realEta ?? "Inconnu",
      status: t.status ?? "unknown",
      ...(t.performanceScore !== undefined && { performanceScore: t.performanceScore }),
      ...(t.completionRate !== undefined && { completionRate: `${t.completionRate}%` }),
      ...(t.avgTicketEur !== undefined && { avgTicketEur: `${t.avgTicketEur}€` }),
    }));

    const performanceCriteria = hasPerformanceData
      ? `4. Performance (30j) : favoriser le technicien avec le meilleur score composite (completionRate élevé, avgTicketEur élevé = valorise mieux le client). Score = combo taux clôture + ticket moyen.`
      : "";

    const systemPrompt = `Tu es un assistant IA spécialisé dans la répartition des interventions techniques (dispatch).
Ta mission : choisir le MEILLEUR technicien pour maximiser la satisfaction client ET le chiffre d'affaires.

Critères de décision (ordre d'importance) :
1. ETA : arriver le plus vite possible (surtout si urgence).
2. Compétences (skills) : compétences adaptées au problème décrit.
3. Statut : privilégier "available".
${performanceCriteria}

Retourne UNIQUEMENT ce JSON :
{
  "bestTechnicianId": "id_du_technicien_choisi",
  "reasoning": "Phrase courte (max 25 mots) expliquant le choix en termes concrets (ETA + compétence + performance si dispo).",
  "revenueImpact": "estimation texte courte de l'impact revenu du choix (ex: '+15% ticket moyen vs équipe') ou null"
}`;

    const userPrompt = `Problème : ${problem ?? "Non précisé"}
Adresse : ${address ?? "Non précisée"}
Urgence : ${urgency ?? "normale"}
Techniciens disponibles :
${JSON.stringify(techList, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.15,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");

    const result = JSON.parse(content) as {
      bestTechnicianId?: string;
      reasoning?: string;
      revenueImpact?: string | null;
    };

    const chosen = technicians.find((t) => t.id === result.bestTechnicianId);
    if (!chosen) {
      result.bestTechnicianId = technicians[0]!.id;
      result.reasoning = "Technicien sélectionné par défaut (anomalie de réponse IA).";
      result.revenueImpact = null;
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("[smart-dispatch]", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Erreur interne", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
