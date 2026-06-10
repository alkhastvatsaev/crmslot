import { test, expect } from "@playwright/test";
import routes from "../fixtures/protected-api-routes.json";

type RouteEntry = {
  method: string;
  path: string;
  body?: Record<string, unknown>;
  localDevBypass?: boolean;
};

function expectProtectedStatus(status: number) {
  expect([401, 403, 503]).toContain(status);
}

test.describe("API routes auth matrix", () => {
  for (const route of routes as RouteEntry[]) {
    test(`${route.method} ${route.path} requires authentication`, async ({ request }) => {
      test.skip(
        !!route.localDevBypass,
        "Bypass dev local (requireAuthenticatedUserOrLocalDev) — non testé en E2E dev."
      );
      const options =
        route.method === "GET"
          ? {}
          : {
              data: route.body ?? {},
            };

      const res = await request.fetch(route.path, {
        method: route.method,
        ...options,
      });

      expectProtectedStatus(res.status());
    });
  }
});
