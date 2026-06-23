"use client";

import { useEffect, useState } from "react";

/** Bandeau discret quand le réseau est coupé (données cache inbox). */
export default function AdminMobileOfflineBar() {
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setOffline(!navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="shrink-0 border-b border-amber-500/30 bg-amber-950/90 px-3 py-2 text-center text-xs font-medium text-amber-100"
      role="status"
      data-testid="admin-mobile-offline-bar"
    >
      Hors ligne — données en cache
    </div>
  );
}
