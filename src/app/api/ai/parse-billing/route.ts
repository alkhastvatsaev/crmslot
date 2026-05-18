import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/core/api/routeAuth';
import { getClient } from '@/core/services/audio/transcription';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `Tu es un assistant de facturation pour une entreprise de serrurerie.
On te donne un rapport de fin d'intervention dicté par le technicien.
Extrais les éléments facturables (déplacements, main d'oeuvre, pièces, etc.).
Réponds UNIQUEMENT avec un objet JSON valide contenant une clé "lines" qui est un tableau d'objets.
Chaque objet du tableau doit respecter cette structure stricte :
{
  "description": string (ex: "Cylindre européen", "Déplacement", "Main d'oeuvre (1h)"),
  "quantity": number (ex: 1, 1.5, 2),
  "unitPriceCents": number (le prix unitaire en centimes d'euros, ex: 120 euros = 12000, 50 euros = 5000),
  "reference": string (optionnel, la référence de la pièce si mentionnée, sinon "")
}
Si aucun montant n'est précisé, mets 0 pour unitPriceCents.`;

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ('response' in auth) return auth.response;

  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Texte manquant' }, { status: 400 });
    }

    const client = getClient();
    
    const model = process.env.OPENAI_DISPATCH_MODEL?.trim() || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Veuillez analyser ce rapport et renvoyer un objet JSON contenant une clé "lines".\n\nRapport :\n"""${transcript}"""`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content || '{"lines": []}';
    let lines = [];
    try {
        const parsed = JSON.parse(content);
        lines = parsed.lines || [];
    } catch (e) {
        console.error("Erreur de parsing JSON", e);
    }

    return NextResponse.json({ success: true, lines });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error('[parse-billing]', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
