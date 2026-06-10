/**
 * @jest-environment node
 */

import { GET } from "@/app/api/mobile/config/route";

describe("GET /api/mobile/config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, NODE_ENV: "test" } as NodeJS.ProcessEnv;
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE;
    delete process.env.NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN;
  });

  afterAll(() => {
    process.env = env;
  });

  it("retourne ok et mobileAccessAllowed", async () => {
    process.env.NEXT_PUBLIC_ALLOW_MOBILE = "true";
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      mobileAccessAllowed: boolean;
      hubPageCount: number;
      forceMobileQueryKey: string;
    };
    expect(body.ok).toBe(true);
    expect(body.mobileAccessAllowed).toBe(true);
    expect(body.forceMobileQueryKey).toBe("forceMobile");
    expect(body.hubPageCount).toBeGreaterThanOrEqual(7);
  });
});
