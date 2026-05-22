"use client";

import { useEffect, useRef, useState } from "react";
import type { CrmActivityEvent } from "../crmActivityTypes";

const HIGHLIGHT_MS = 8_000;

/**
 * Détecte les événements ajoutés après le premier rendu (feed temps réel).
 * Au montage, enregistre les ids présents sans surbrillance.
 */
export function useCrmNewEventHighlight(
  events: CrmActivityEvent[],
  options?: { enabled?: boolean },
): Set<string> {
  const enabled = options?.enabled !== false;
  const seededRef = useRef(false);
  const knownIdsRef = useRef(new Set<string>());
  const [highlightIds, setHighlightIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!enabled) {
      seededRef.current = false;
      knownIdsRef.current = new Set();
      setHighlightIds(new Set());
      return;
    }

    const ids = events.map((e) => e.id);
    if (!seededRef.current) {
      knownIdsRef.current = new Set(ids);
      seededRef.current = true;
      return;
    }

    const fresh: string[] = [];
    for (const id of ids) {
      if (!knownIdsRef.current.has(id)) {
        fresh.push(id);
        knownIdsRef.current.add(id);
      }
    }

    if (fresh.length === 0) return;

    setHighlightIds((prev) => {
      const next = new Set(prev);
      for (const id of fresh) next.add(id);
      return next;
    });

    const timers = fresh.map((id) =>
      window.setTimeout(() => {
        setHighlightIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, HIGHLIGHT_MS),
    );

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [events, enabled]);

  return highlightIds;
}
