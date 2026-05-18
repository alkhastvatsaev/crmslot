"use client";

import { useEffect, useState } from "react";
import { firestore, isConfigured } from "@/core/config/firebase";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { subscribeCatalogProducts } from "@/features/catalog/catalogFirestore";
import type { CatalogProduct } from "@/features/catalog/types";

export function useCompanyCatalog(): {
  products: CatalogProduct[];
  loading: boolean;
} {
  const lecotEnabled = useFeatureFlag("lecotProductSearch");
  const workspace = useCompanyWorkspaceOptional();
  const companyId = workspace?.activeCompanyId?.trim() ?? "";
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lecotEnabled || !firestore || !isConfigured || !companyId) {
      setProducts([]);
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    return subscribeCatalogProducts(firestore, companyId, (rows) => {
      setProducts(rows);
      setLoading(false);
    });
  }, [lecotEnabled, companyId]);

  return { products, loading };
}
