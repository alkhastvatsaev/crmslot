import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import {
  handleBillingHubAgentPost,
  type BillingHubAgentPostBody,
} from "@/features/billingHub/billingHubAgentRouteHandler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const body = (await req.json().catch(() => null)) as BillingHubAgentPostBody | null;
  return handleBillingHubAgentPost(body, { uid: authResult.uid });
}
