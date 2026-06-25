"use client";

import { useEffect, useState } from "react";

/** Vrai si le layout hub est dans un panneau mobile visible (pas carte masquée). */
export function useMobileHubPanelVisible(element: HTMLElement | null): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!element) return;

    const panel = element.closest<HTMLElement>(".mobile-screen-host-panel");
    if (!panel) {
      setVisible(true);
      return;
    }

    const readVisible = () => {
      const ariaHidden = panel.getAttribute("aria-hidden") === "true";
      const styleHidden = panel.style.visibility === "hidden";
      setVisible(!ariaHidden && !styleHidden);
    };

    readVisible();
    const observer = new MutationObserver(readVisible);
    observer.observe(panel, {
      attributes: true,
      attributeFilter: ["aria-hidden", "style"],
    });
    return () => observer.disconnect();
  }, [element]);

  return visible;
}
