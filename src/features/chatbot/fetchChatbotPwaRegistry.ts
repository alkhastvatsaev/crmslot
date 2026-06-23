import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { MaterialOrderDoc } from "@/features/materials";
import type { SupplierOrder } from "@/features/suppliers";

export type ChatbotPwaRegistry = {
  supplierOrders: SupplierOrder[];
  materialOrders: MaterialOrderDoc[];
};

export type FetchChatbotPwaRegistryResult =
  | { ok: true; data: ChatbotPwaRegistry }
  | { ok: false; status: number; message: string };

export async function fetchChatbotPwaRegistry(
  companyId: string
): Promise<FetchChatbotPwaRegistryResult> {
  const cid = companyId.trim();
  if (!cid) {
    return { ok: false, status: 400, message: "companyId requis" };
  }

  try {
    const res = await fetchWithAuth(`/api/companies/${encodeURIComponent(cid)}/pwa-registry`);
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      supplierOrders?: SupplierOrder[];
      materialOrders?: MaterialOrderDoc[];
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: body.error ?? `Erreur HTTP ${res.status}`,
      };
    }

    return {
      ok: true,
      data: {
        supplierOrders: Array.isArray(body.supplierOrders) ? body.supplierOrders : [],
        materialOrders: Array.isArray(body.materialOrders) ? body.materialOrders : [],
      },
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      message: e instanceof Error ? e.message : "Réseau",
    };
  }
}
