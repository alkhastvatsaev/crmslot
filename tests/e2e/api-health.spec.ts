import { test, expect } from "@playwright/test";

test.describe("API health", () => {
  test("GET /api/health returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok?: boolean; service?: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("crmslot");
  });
});
