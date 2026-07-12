import { NextResponse } from "next/server";
import Stripe from "stripe";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { syncSubscriptionCheckoutSessionAdmin } from "@/features/subscriptions/index.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!stripeSecret) {
    return NextResponse.json({ error: "Stripe non configuré." }, { status: 500 });
  }

  let body: { sessionId?: string };
  try {
    body = (await request.json()) as { sessionId?: string };
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId requis." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: "2026-04-22.dahlia" });
  const db = getAdminDb();

  try {
    const synced = await syncSubscriptionCheckoutSessionAdmin({
      db,
      stripe,
      adminUid: auth.uid,
      sessionId,
    });
    if (!synced) {
      return NextResponse.json({ error: "Session Stripe invalide." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Synchronisation impossible.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
