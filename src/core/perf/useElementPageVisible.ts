"use client";

import { useEffect, useState, type RefObject } from "react";

function isElementPageVisible(el: HTMLElement): boolean {
  if (typeof document !== "undefined" && document.hidden) return false;
  if (el.offsetWidth < 2 || el.offsetHeight < 2) return false;
  const host = el.closest("[aria-hidden='true'], [inert]");
  if (host && host !== el) return false;
  return true;
}

/**
 * Élément visible à l'écran (intersection + pas aria-hidden / inert parent).
 * Utilisé pour couper WebGL / canvas hors viewport.
 */
export function useElementPageVisible(targetRef: RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(() => {
    const el = targetRef.current;
    return el ? isElementPageVisible(el) : false;
  });

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const sync = () => setVisible(isElementPageVisible(el));

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(() => sync(), { threshold: 0.02, rootMargin: "4px" })
        : null;
    io?.observe(el);

    const mo = new MutationObserver(sync);
    let node: HTMLElement | null = el;
    while (node) {
      if (node.hasAttribute("aria-hidden") || node.hasAttribute("inert")) {
        mo.observe(node, { attributes: true, attributeFilter: ["aria-hidden", "inert"] });
      }
      node = node.parentElement;
    }

    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      io?.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [targetRef]);

  return visible;
}
