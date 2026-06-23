"use client";

import { useLayoutEffect, useState } from "react";

export function useMapTranscriptionActionsRailRect(editOpen: boolean) {
  const [railScreenRect, setRailScreenRect] = useState<{ left: number; width: number } | null>(
    null
  );

  useLayoutEffect(() => {
    if (!editOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRailScreenRect(null);
      return;
    }
    const read = () => {
      const el = document.getElementById("dashboard-left-rail");
      if (!el) {
        setRailScreenRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.right < 24 || r.left > window.innerWidth - 24) {
        setRailScreenRect(null);
        return;
      }
      const container = document.getElementById("dashboard-root-scroll");
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const left = r.left - containerRect.left + container.scrollLeft;
        setRailScreenRect({ left, width: r.width });
      } else {
        setRailScreenRect({ left: r.left, width: r.width });
      }
    };
    read();
    const raf = window.requestAnimationFrame(read);
    const el = document.getElementById("dashboard-left-rail");
    const container = document.getElementById("dashboard-root-scroll");
    const ro = new ResizeObserver(read);
    if (el) ro.observe(el);
    if (container) {
      container.addEventListener("scroll", read);
    }
    window.addEventListener("resize", read);
    window.visualViewport?.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (container) {
        container.removeEventListener("scroll", read);
      }
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, [editOpen]);

  return railScreenRect;
}
