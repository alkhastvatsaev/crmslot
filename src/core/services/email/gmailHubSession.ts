import type { NextRequest, NextResponse } from "next/server";

export const GMAIL_HUB_DISCONNECTED_COOKIE = "gmail_hub_disconnected";

export function isGmailHubUserDisconnected(req: NextRequest): boolean {
  return req.cookies.get(GMAIL_HUB_DISCONNECTED_COOKIE)?.value === "1";
}

export function setGmailHubDisconnectedCookie(res: NextResponse, disconnected: boolean): void {
  if (disconnected) {
    res.cookies.set(GMAIL_HUB_DISCONNECTED_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else {
    res.cookies.set(GMAIL_HUB_DISCONNECTED_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}
