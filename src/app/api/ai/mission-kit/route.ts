import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/core/api/routeAuth";
import {
  handleMissionKitPost,
  type MissionKitPostBody,
} from "@/features/missionKit/missionKitRouteHandler";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authResult = await requireAuthenticatedUser(req);
  if ("response" in authResult) return authResult.response;

  const body = (await req.json().catch(() => null)) as MissionKitPostBody | null;
  return handleMissionKitPost(body);
}
