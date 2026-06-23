import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import { isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { loadCompanyPwaRegistryAdmin } from "@/features/mobile/index.server";
import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ companyId: string }> };

/** Liste commandes fournisseur + bons matériel (Admin SDK — fiable si règles client bloquent). */
export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthenticatedUser(request);
  if ("response" in auth) return auth.response;

  const { companyId } = await context.params;
  const cid = companyId?.trim();
  if (!cid) {
    return NextResponse.json({ error: "companyId requis" }, { status: 400 });
  }

  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      {
        error:
          "Firebase Admin absent : ajoutez FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY dans .env.local (voir .env.example), puis redémarrez npm run dev.",
        adminReady: false,
      },
      { status: 503 }
    );
  }

  const payload = await loadCompanyPwaRegistryAdmin(admin.firestore(), cid);
  return NextResponse.json(payload);
}
