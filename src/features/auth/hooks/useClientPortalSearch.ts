"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { Intervention } from "@/features/interventions";

export function useClientPortalSearch() {
  const [searchName, setSearchName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Intervention | "not_found" | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = searchName.trim().toLowerCase();
    if (!name) return;

    setIsSearching(true);
    setSearchResult(null);
    try {
      if (!firestore || !auth?.currentUser) {
        setSearchResult("not_found");
        return;
      }

      const q = query(
        collection(firestore, "interventions"),
        where("createdByUid", "==", auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const needle = searchName.trim().toLowerCase();
      const hit = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Intervention)
        .find((row) => {
          const last = (row.clientLastName ?? "").toLowerCase();
          const first = (row.clientFirstName ?? "").toLowerCase();
          return last.includes(needle) || first.includes(needle);
        });
      setSearchResult(hit ?? "not_found");
    } catch (err) {
      logger.error("handleSearch", { error: err instanceof Error ? err.message : String(err) });
      setSearchResult("not_found");
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchName,
    setSearchName,
    isSearching,
    searchResult,
    handleSearch,
  };
}
