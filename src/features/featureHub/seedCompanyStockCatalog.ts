import { createStockItem, type StockItemInput } from "@/features/materials/stockFirestore";
import { DEMO_COMPANY_STOCK_CATALOG } from "@/features/dev/demoCompanyStock";

/** Injecte le kit serrurerie dans Firestore (stock réel, plus démo en mémoire). */
export async function seedCompanyStockCatalog(companyId: string): Promise<number> {
  const cid = companyId.trim();
  if (!cid) return 0;
  let created = 0;
  for (const row of DEMO_COMPANY_STOCK_CATALOG) {
    const input: StockItemInput = {
      companyId: cid,
      reference: row.reference,
      description: row.description,
      quantity: row.quantity,
      alertThreshold: row.alertThreshold,
      unit: row.unit,
    };
    await createStockItem(input);
    created += 1;
  }
  return created;
}
