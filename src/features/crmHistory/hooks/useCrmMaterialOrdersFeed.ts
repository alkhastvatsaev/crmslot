"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import {
  MATERIAL_ORDERS_COLLECTION,
  type MaterialOrderDoc,
} from "@/features/materials/materialOrderFirestore";
import { useCompanyMaterialOrdersRecent } from "@/features/featureHub/hooks/useCompanyMaterialOrdersRecent";
import type { Intervention } from "@/features/interventions";
import { parseTs } from "../crmActivityLog";

const INTERVENTION_CHUNK = 10;
const INTERVENTION_SCAN_LIMIT = 40;
const PER_CHUNK_LIMIT = 30;

function mergeMaterialOrders(...lists: MaterialOrderDoc[][]): MaterialOrderDoc[] {
  const byId = new Map<string, MaterialOrderDoc>();
  for (const list of lists) {
    for (const row of list) byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) => parseTs(b.createdAt) - parseTs(a.createdAt));
}

function pickInterventionIdsForOrderScan(interventions: Intervention[]): string[] {
  return [...interventions]
    .sort((a, b) => parseTs(b.updatedAt) - parseTs(a.updatedAt))
    .slice(0, INTERVENTION_SCAN_LIMIT)
    .map((iv) => iv.id);
}

function orderMatchesCompany(row: MaterialOrderDoc, companyId: string | null): boolean {
  if (!companyId) return true;
  const rowCompanyId = typeof row.companyId === "string" ? row.companyId.trim() : "";
  return !rowCompanyId || rowCompanyId === companyId;
}

/** Commandes matériel société + filet par dossiers récents (bons sans companyId). */
export function useCrmMaterialOrdersFeed(companyId: string | null, interventions: Intervention[]) {
  const { orders: companyOrders, loading: companyLoading } =
    useCompanyMaterialOrdersRecent(companyId);
  const [interventionOrders, setInterventionOrders] = useState<MaterialOrderDoc[]>([]);
  const [interventionLoading, setInterventionLoading] = useState(false);

  const interventionIds = useMemo(
    () => pickInterventionIdsForOrderScan(interventions),
    [interventions]
  );
  const interventionIdsKey = interventionIds.join("|");

  useEffect(() => {
    if (!firestore || interventionIds.length === 0) {
      setInterventionOrders([]);
      setInterventionLoading(false);
      return;
    }

    setInterventionLoading(true);
    const byId = new Map<string, MaterialOrderDoc>();
    const chunks: string[][] = [];
    for (let i = 0; i < interventionIds.length; i += INTERVENTION_CHUNK) {
      chunks.push(interventionIds.slice(i, i + INTERVENTION_CHUNK));
    }

    const flush = () => {
      setInterventionOrders([...byId.values()]);
      setInterventionLoading(false);
    };

    const unsubs = chunks.map((chunk) => {
      const q = query(
        collection(firestore, MATERIAL_ORDERS_COLLECTION),
        where("interventionId", "in", chunk),
        limit(PER_CHUNK_LIMIT * chunk.length)
      );
      return onSnapshot(
        q,
        (snap) => {
          for (const d of snap.docs) {
            const row = { id: d.id, ...(d.data() as Omit<MaterialOrderDoc, "id">) };
            if (!orderMatchesCompany(row, companyId)) continue;
            byId.set(row.id, row);
          }
          flush();
        },
        () => flush()
      );
    });

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [companyId, interventionIdsKey, interventionIds.length]);

  const orders = useMemo(
    () => mergeMaterialOrders(companyOrders, interventionOrders),
    [companyOrders, interventionOrders]
  );

  return { orders, loading: companyLoading || interventionLoading };
}
