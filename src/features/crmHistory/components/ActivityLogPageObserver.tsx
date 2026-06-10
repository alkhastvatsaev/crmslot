"use client";

import { useEffect, useRef } from "react";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useActivityLog } from "../useActivityLog";

/**
 * Composant invisible monté dans le DashboardPager.
 * Chaque changement de page déclenche un log crm_activity (page_navigated).
 * La première page au mount est aussi loggée.
 */
export default function ActivityLogPageObserver() {
  const { pageIndex } = useDashboardPager();
  const { logPage } = useActivityLog();
  const prevRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevRef.current === pageIndex) return;
    prevRef.current = pageIndex;
    logPage(pageIndex);
  }, [pageIndex, logPage]);

  return null;
}
