import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import "@/core/config/firebase-admin";
import {
  handleCrmHistoryAgentPost,
  type CrmHistoryAgentPostBody,
} from "@/features/crmHistory/crmHistoryAgentRouteHandler";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const body = (await req.json().catch(() => null)) as CrmHistoryAgentPostBody | null;
  return handleCrmHistoryAgentPost(body, { uid: authResult.uid });
}
