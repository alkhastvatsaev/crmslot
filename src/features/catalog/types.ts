export interface CatalogProduct {
  id: string;
  companyId: string;
  sku: string;
  label: string;
  unitPriceCents: number;
  supplier?: string | null;
  /** Référence fournisseur Lecot (lien catalogue externe). */
  lecotSku?: string | null;
  category?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
