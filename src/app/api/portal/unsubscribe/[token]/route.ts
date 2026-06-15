import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";

export const runtime = "nodejs";

function renderConfirmation(opts: { ok: boolean; message: string }): string {
  const bg = "#0a0a0a";
  const card = "#141414";
  const border = "#222";
  const text = "#f5f5f5";
  const accent = opts.ok ? "#9ad9ff" : "#ff6b6b";
  return `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Désabonnement — CRMSLOT</title>
<style>
  body { margin:0; background:${bg}; color:${text}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px }
  .card { background:${card}; border:1px solid ${border}; border-radius:16px; padding:32px; max-width:480px; width:100%; text-align:center }
  .brand { font-size:13px; letter-spacing:2px; color:${accent}; font-weight:600; margin-bottom:8px }
  h1 { font-size:22px; margin:0 0 16px; font-weight:600 }
  p { margin:0; line-height:1.6; color:${text} }
</style>
</head><body>
  <div class="card">
    <div class="brand">CRMSLOT</div>
    <h1>${opts.ok ? "Désabonnement confirmé" : "Lien invalide"}</h1>
    <p>${opts.message}</p>
  </div>
</body></html>`;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ token: string }> }
): Promise<Response> {
  const { token } = await context.params;
  const cleaned = token?.trim();
  if (!cleaned) {
    return new NextResponse(renderConfirmation({ ok: false, message: "Token manquant." }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const db = getAdminDb();
  const snap = await db
    .collection("clients")
    .where("unsubscribeToken", "==", cleaned)
    .limit(1)
    .get();
  if (snap.empty) {
    return new NextResponse(
      renderConfirmation({
        ok: false,
        message: "Ce lien de désabonnement n'est plus valide. Vous êtes peut-être déjà désabonné.",
      }),
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const docRef = snap.docs[0].ref;
  try {
    await docRef.update({ emailNotifications: false });
  } catch (err) {
    logger.error("[unsubscribe] update failed", { token: cleaned, err });
    return new NextResponse(
      renderConfirmation({
        ok: false,
        message: "Une erreur est survenue. Réessayez plus tard.",
      }),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    renderConfirmation({
      ok: true,
      message:
        "Vous ne recevrez plus de notifications email de la part de votre prestataire CRMSLOT. Les communications transactionnelles obligatoires (factures, signatures légales) peuvent rester actives.",
    }),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
