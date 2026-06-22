"use client";

/**
 * Dock Galaxy portail client — chrome visuel uniquement.
 * N’embarque pas DashboardGalaxyLayer (admin : dispatch vocal, hubs back-office).
 */
export default function ClientMobileGalaxyDock() {
  return (
    <div
      className="client-mobile-galaxy-dock h-full min-h-0 w-full"
      data-testid="client-mobile-galaxy-dock"
      aria-hidden
    />
  );
}
