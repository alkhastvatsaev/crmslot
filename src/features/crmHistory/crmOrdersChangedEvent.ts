/** Signal navigateur — commande matériel / fournisseur créée ou mise à jour (écoute fil Historique). */
export const BELGMAP_CRM_ORDERS_CHANGED_EVENT = "belmap-crm-orders-changed" as const;

export type CrmOrdersChangedDetail = {
  companyId: string;
  supplierOrderId?: string | null;
  materialOrderId?: string | null;
};

export function dispatchCrmOrdersChanged(detail: CrmOrdersChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(BELGMAP_CRM_ORDERS_CHANGED_EVENT, { detail }),
  );
}
