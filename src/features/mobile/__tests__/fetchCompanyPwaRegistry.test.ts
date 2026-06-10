import { fetchCompanyPwaRegistry } from "@/features/mobile/fetchMobileRuntimeConfig";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const fetchWithAuthMock = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

describe("fetchCompanyPwaRegistry", () => {
  beforeEach(() => {
    fetchWithAuthMock.mockReset();
  });

  it("refuse un companyId vide", async () => {
    const result = await fetchCompanyPwaRegistry("  ");
    expect(result).toEqual({ ok: false, status: 400, message: "companyId requis" });
    expect(fetchWithAuthMock).not.toHaveBeenCalled();
  });

  it("retourne le payload quand la route répond 200", async () => {
    fetchWithAuthMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ materialOrders: [], supplierOrders: [] }),
    } as Response);

    const result = await fetchCompanyPwaRegistry("acme-co");
    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/companies/acme-co/pwa-registry");
    expect(result).toEqual({
      ok: true,
      data: { materialOrders: [], supplierOrders: [] },
    });
  });

  it("retourne l’erreur API quand la route échoue", async () => {
    fetchWithAuthMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({ error: "Accès refusé" }),
    } as Response);

    const result = await fetchCompanyPwaRegistry("acme-co");
    expect(result).toEqual({ ok: false, status: 403, message: "Accès refusé" });
  });
});
