import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import type { CatalogProduct } from "@/features/catalog/productQuickAdd";
import { firestoreProductToQuickAdd } from "@/features/catalog/mapCompanyCatalogProduct";

/** Charge les produits actifs d'une société (côté serveur, Admin SDK). */
export async function loadCompanyCatalogProducts(companyId: string): Promise<CatalogProduct[]> {
  const cid = companyId.trim();
  if (!cid || !admin.apps.length) return [];

  const snap = await admin
    .firestore()
    .collection("companies")
    .doc(cid)
    .collection("products")
    .where("isActive", "==", true)
    .orderBy("label")
    .limit(120)
    .get();

  return snap.docs
    .map((d) => firestoreProductToQuickAdd(d.data()))
    .filter((p): p is CatalogProduct => p !== null);
}
