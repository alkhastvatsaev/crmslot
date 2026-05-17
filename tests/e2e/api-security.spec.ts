import { test, expect } from "@playwright/test";

/** Non autorisé ou serveur non configuré (Firebase Admin) — jamais 200 sans auth. */
function expectProtectedStatus(status: number) {
  expect([401, 403, 503]).toContain(status);
}

test.describe("API security (sans jeton)", () => {
  test("routes sensibles ne sont pas publiques", async ({ request }) => {
    const geocode = await request.get("/api/maps/geocode?q=Bruxelles");
    expectProtectedStatus(geocode.status());

    const audios = await request.get("/api/ai/audios");
    expectProtectedStatus(audios.status());

    const email = await request.post("/api/email", {
      data: { clientName: "Test", pdfBase64: "dGVzdA==" },
    });
    expectProtectedStatus(email.status());
  });

  test("health reste public", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
