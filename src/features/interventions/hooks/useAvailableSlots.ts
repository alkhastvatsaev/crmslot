import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { format } from "date-fns";
import { getInterventionOccupiedRange } from "@/features/scheduling/interventionOccupiedRange";
import type { Intervention } from "@/features/interventions/types";

/** Créneaux HH:mm déjà occupés (toute la société) pour une date donnée. */
export function bookedTimesForDate(
  interventions: Array<
    Pick<
      Intervention,
      "status" | "scheduledDate" | "scheduledTime" | "requestedDate" | "requestedTime"
    >
  >,
  dateYmd: string
): string[] {
  const booked: string[] = [];
  for (const iv of interventions) {
    if (iv.status === "cancelled") continue;
    const range = getInterventionOccupiedRange(iv as Intervention);
    if (!range) continue;
    const d = new Date(range.startMs);
    const key = format(d, "yyyy-MM-dd");
    if (key !== dateYmd) continue;
    booked.push(format(d, "HH:mm"));
  }
  return booked;
}

export function useAvailableSlots(
  companyId: string | null | undefined,
  date: string | null = null
) {
  const [bookedSlotsByDate, setBookedSlotsByDate] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSlots() {
      if (!companyId || !firestore) {
        if (isMounted) setBookedSlotsByDate({});
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const todayStr = format(new Date(), "yyyy-MM-dd");

        const q = query(
          collection(firestore, "interventions"),
          where("companyId", "==", companyId)
        );

        const snapshot = await getDocs(q);
        const rows: Intervention[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Intervention
        );

        const active = rows.filter(
          (iv) => iv.status !== "cancelled" && iv.status !== "done" && iv.status !== "invoiced"
        );

        const dates = new Set<string>();
        for (const iv of active) {
          const range = getInterventionOccupiedRange(iv);
          if (!range) continue;
          const key = format(new Date(range.startMs), "yyyy-MM-dd");
          if (key >= todayStr) dates.add(key);
        }

        const booked: Record<string, string[]> = {};
        for (const dateKey of dates) {
          booked[dateKey] = bookedTimesForDate(active, dateKey);
        }

        if (isMounted) {
          setBookedSlotsByDate(booked);
        }
      } catch (err: unknown) {
        logger.error("Error fetching available slots:", {
          error: err instanceof Error ? err.message : String(err),
        });
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch slots");
          setBookedSlotsByDate({});
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const bookedSlots = date ? bookedSlotsByDate[date] || [] : [];

  return { bookedSlots, bookedSlotsByDate, loading, error };
}
