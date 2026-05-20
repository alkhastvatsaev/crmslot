export interface StockItem {
  id: string;
  companyId: string;
  technicianUid: string;
  sku: string;
  label: string;
  quantity: number;
  minQuantity: number;
  unitPriceCents: number;
  updatedAt: string;
}

export function isStockLow(item: StockItem): boolean {
  return item.quantity <= item.minQuantity;
}
