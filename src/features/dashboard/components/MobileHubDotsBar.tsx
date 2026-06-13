"use client";

import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import { MOBILE_HUB_DOTS_BAR_CLASS } from "@/core/ui/dashboardMobileLayout";

export default function MobileHubDotsBar() {
  const snapshot = useMobileHubRailSnapshot();
  if (!snapshot || snapshot.rails.length <= 1) return null;

  const activeIndex = snapshot.rails.indexOf(snapshot.activeRail);

  return (
    <div className={MOBILE_HUB_DOTS_BAR_CLASS} data-testid="mobile-hub-dots-bar" aria-hidden>
      <div className="mobile-hub-dots">
        {snapshot.rails.map((rail, index) => (
          <div
            key={rail}
            className={`mobile-hub-dot${index === activeIndex ? " mobile-hub-dot--active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
