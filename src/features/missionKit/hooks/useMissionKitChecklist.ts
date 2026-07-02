"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveMissionKitChecklistToFirestore } from "@/features/missionKit/missionKitChecklistFirestore";

const SAVE_DEBOUNCE_MS = 500;

type Params = {
  enabled?: boolean;
  interventionId: string;
  technicianUid: string;
  initialCheckedIds?: string[] | null;
};

export function useMissionKitChecklist({
  enabled = true,
  interventionId,
  technicianUid,
  initialCheckedIds,
}: Params) {
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>(initialCheckedIds ?? []);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const interventionRef = useRef(interventionId);

  useEffect(() => {
    interventionRef.current = interventionId;
    setCheckedItemIds(initialCheckedIds ?? []);
  }, [interventionId, initialCheckedIds]);

  const persist = useCallback(
    async (ids: string[]) => {
      if (!enabled) return;
      const id = interventionRef.current.trim();
      const uid = technicianUid.trim();
      if (!id || !uid) return;
      setSaving(true);
      try {
        await saveMissionKitChecklistToFirestore(id, ids, uid);
      } finally {
        setSaving(false);
      }
    },
    [enabled, technicianUid]
  );

  useEffect(() => {
    if (!enabled) return;
    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void persist(checkedItemIds);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    };
  }, [checkedItemIds, enabled, persist]);

  const toggleItem = useCallback((itemId: string) => {
    setCheckedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }, []);

  return {
    checkedItemIds,
    toggleItem,
    saving,
    isChecked: (itemId: string) => checkedItemIds.includes(itemId),
  };
}
