import { test, expect } from "@playwright/test";

test.describe("API pwa-registry auth", () => {
  test("GET /api/companies/:id/pwa-registry requires authentication", async ({ request }) => {
    const res = await request.get("/api/companies/fixture-co/pwa-registry");
    expect([401, 403, 503]).toContain(res.status());
  });
});
