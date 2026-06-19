import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Legacy RAG endpoint — retiré au profit de /api/ai/chatbot (auth + contrôle tenant). */
export async function POST() {
  return NextResponse.json(
    { error: "Endpoint retiré — utiliser /api/ai/chatbot." },
    { status: 410 }
  );
}
