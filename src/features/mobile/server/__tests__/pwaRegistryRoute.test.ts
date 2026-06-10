/**
 * @jest-environment node
 */

import { GET } from "@/app/api/companies/[companyId]/pwa-registry/route";

jest.mock("@/core/api/routeAuth", () => ({
  requireAuthenticatedUser: jest.fn(),
}));

jest.mock("@/core/config/firebase-admin", () => ({
  isFirebaseAdminReady: jest.fn(),
}));

jest.mock("@/features/mobile/server/companyPwaRegistryAdmin", () => ({
  loadCompanyPwaRegistryAdmin: jest.fn(),
}));

jest.mock("firebase-admin", () => ({
  firestore: jest.fn(() => ({})),
}));

const requireAuthenticatedUser = jest.requireMock("@/core/api/routeAuth")
  .requireAuthenticatedUser as jest.Mock;
const isFirebaseAdminReady = jest.requireMock("@/core/config/firebase-admin")
  .isFirebaseAdminReady as jest.Mock;
const loadCompanyPwaRegistryAdmin = jest.requireMock(
  "@/features/mobile/server/companyPwaRegistryAdmin"
).loadCompanyPwaRegistryAdmin as jest.Mock;

describe("GET /api/companies/[companyId]/pwa-registry", () => {
  beforeEach(() => {
    requireAuthenticatedUser.mockReset();
    isFirebaseAdminReady.mockReset();
    loadCompanyPwaRegistryAdmin.mockReset();
  });

  it("401 sans auth", async () => {
    requireAuthenticatedUser.mockResolvedValue({
      response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const res = await GET(new Request("http://localhost/api/companies/co-1/pwa-registry"), {
      params: Promise.resolve({ companyId: "co-1" }),
    });
    expect(res.status).toBe(401);
  });

  it("400 si companyId vide", async () => {
    requireAuthenticatedUser.mockResolvedValue({ uid: "user-1" });

    const res = await GET(new Request("http://localhost/api/companies/ /pwa-registry"), {
      params: Promise.resolve({ companyId: "  " }),
    });
    expect(res.status).toBe(400);
  });

  it("503 si Firebase Admin absent", async () => {
    requireAuthenticatedUser.mockResolvedValue({ uid: "user-1" });
    isFirebaseAdminReady.mockReturnValue(false);

    const res = await GET(new Request("http://localhost/api/companies/co-1/pwa-registry"), {
      params: Promise.resolve({ companyId: "co-1" }),
    });
    expect(res.status).toBe(503);
  });

  it("200 avec supplierOrders et materialOrders", async () => {
    requireAuthenticatedUser.mockResolvedValue({ uid: "user-1" });
    isFirebaseAdminReady.mockReturnValue(true);
    loadCompanyPwaRegistryAdmin.mockResolvedValue({
      supplierOrders: [{ id: "so-1" }],
      materialOrders: [{ id: "mo-1" }],
    });

    const res = await GET(new Request("http://localhost/api/companies/co-1/pwa-registry"), {
      params: Promise.resolve({ companyId: "co-1" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      supplierOrders: { id: string }[];
      materialOrders: { id: string }[];
    };
    expect(body.supplierOrders[0]?.id).toBe("so-1");
    expect(body.materialOrders[0]?.id).toBe("mo-1");
    expect(loadCompanyPwaRegistryAdmin).toHaveBeenCalledWith({}, "co-1");
  });
});
