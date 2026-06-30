"use client";

import { useEffect, useState } from "react";

function isMapRenderAllowed(container: HTMLElement): boolean {
  if (typeof document !== "undefined" && document.hidden) return false;

  const pageHost = container.closest('[data-testid="mobile-page-0"]');
  if (pageHost?.getAttribute("aria-hidden") === "true") return false;

  const mapRail = container.closest('[data-mobile-hub-rail="left"]');
  if (mapRail?.getAttribute("data-mobile-hub-rail-active") === "false") return false;

  return true;
}

/**
 * Sur mobile, la carte reste montée (WebGL) mais doit s'arrêter dès qu'elle n'est plus visible :
 * autre page hub, sélecteur profil, rail missions/inbox, onglet arrière-plan.
 */
export function useMobileMapRenderGate(container: HTMLElement | null): boolean {
  const [active, setActive] = useState(() => (container ? isMapRenderAllowed(container) : false));

  useEffect(() => {
    if (!container) {
      setActive(false);
      return;
    }

    const sync = () => setActive(isMapRenderAllowed(container));

    sync();

    const watched = new Set<HTMLElement>();
    let node: HTMLElement | null = container;
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
  }, [container]);

  return active;
}
