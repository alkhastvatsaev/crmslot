/** @jest-environment node */

import { NextResponse } from "next/server";
import {
  authorizeAudioDispatch,
  authorizeProcessUploads,
  blockIfProduction,
  requireAuthenticatedUser,
} from "@/core/api/routeAuth";

const verifyIdToken = jest.fn();

jest.mock("firebase-admin", () => ({
  apps: [{ name: "test-app" }],
  auth: jest.fn(() => ({ verifyIdToken })),
}));

jest.mock("@/core/config/firebase-admin", () => ({}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requireAuthenticatedUser", () => {
  it("returns 401 when Bearer token is missing", async () => {
    const result = await requireAuthenticatedUser(new Request("http://localhost/api/test"));
    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns uid when token is valid", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "user-1" });
    const result = await requireAuthenticatedUser(
      new Request("http://localhost/api/test", {
        headers: { authorization: "Bearer good-token" },
      }),
    );
    expect("uid" in result && result.uid).toBe("user-1");
  });
});

describe("blockIfProduction", () => {
  it("blocks in production", () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "production" });
    const blocked = blockIfProduction();
    expect(blocked).toBeInstanceOf(NextResponse);
    expect(blocked?.status).toBe(404);
  });

  it("allows in development", () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "development" });
    expect(blockIfProduction()).toBeNull();
  });
});

describe("authorizeProcessUploads", () => {
  afterEach(() => {
    delete process.env.UPLOAD_AUTO_PROCESS_SECRET;
  });

  it("accepts matching upload secret", async () => {
    process.env.UPLOAD_AUTO_PROCESS_SECRET = "secret-1";
    const ok = await authorizeProcessUploads(
      new Request("http://localhost", { headers: { "x-upload-auto-secret": "secret-1" } }),
    );
    expect(ok).toBe(true);
  });

  it("denies in production without secret or token", async () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "production" });
    process.env.UPLOAD_AUTO_PROCESS_SECRET = "required";
    const ok = await authorizeProcessUploads(new Request("http://localhost"));
    expect(ok).toBe(false);
  });
});

describe("authorizeAudioDispatch", () => {
  afterEach(() => {
    delete process.env.AUDIO_DISPATCH_SECRET;
  });

  it("allows dev without secret", async () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "development" });
    expect(await authorizeAudioDispatch(new Request("http://localhost"))).toBe(true);
  });

  it("requires dispatch secret in production when configured", async () => {
    jest.replaceProperty(process, "env", { ...process.env, NODE_ENV: "production" });
    process.env.AUDIO_DISPATCH_SECRET = "macrodroid-key";
    expect(await authorizeAudioDispatch(new Request("http://localhost"))).toBe(false);
    expect(
      await authorizeAudioDispatch(
        new Request("http://localhost", { headers: { "x-audio-dispatch-secret": "macrodroid-key" } }),
      ),
    ).toBe(true);
  });
});
