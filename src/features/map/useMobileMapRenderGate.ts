"use client";

import { useEffect, useState, type RefObject } from "react";

function isMapRenderAllowed(container: HTMLElement): boolean {
  if (typeof document !== "undefined" && document.hidden) return false;

  const pageHost = container.closest('[data-testid="mobile-page-0"]');
  if (pageHost?.getAttribute("aria-hidden") === "true") return false;

  const mapRail = container.closest('[data-mobile-hub-rail="left"]');
  if (mapRail?.getAttribute("data-mobile-hub-rail-active") === "false") return false;

  return true;
}

/**
 * Sur mobile, la carte reste montée (WebGL) mais doit s’arrêter dès qu’elle n’est plus visible :
 * autre page hub, sélecteur profil, rail missions/inbox, onglet arrière-plan.
 */
export function useMobileMapRenderGate(containerRef: RefObject<HTMLElement | null>): boolean {
  const [active, setActive] = useState(() => {
    const root = containerRef.current;
    return root ? isMapRenderAllowed(root) : true;
  });

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const sync = () => setActive(isMapRenderAllowed(root));

    sync();

    const watched = new Set<HTMLElement>();
    let node: HTMLElement | null = root;
    while (node) {
      if (
        node.hasAttribute("aria-hidden") ||
        node.hasAttribute("data-mobile-hub-rail-active") ||
        node.dataset.testid === "mobile-page-0"
      ) {
        watched.add(node);
      }
      node = node.parentElement;
    }

    const observers = [...watched].map((el) => {
      const observer = new MutationObserver(sync);
      observer.observe(el, {
        attributes: true,
        attributeFilter: ["aria-hidden", "data-mobile-hub-rail-active"],
      });
      return observer;
    });

    document.addEventListener("visibilitychange", sync);
    return () => {
      observers.forEach((o) => o.disconnect());
      document.removeEventListener("visibilitychange", sync);
    };
  }, [containerRef]);

  return active;
}
