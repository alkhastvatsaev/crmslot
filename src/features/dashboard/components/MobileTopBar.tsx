"use client";

import UserProfile from "@/features/dashboard/components/UserProfile";

type Props = { onToggle?: () => void };

export default function MobileTopBar({ onToggle }: Props) {
  return (
    <button
      type="button"
      className="mobile-top-bar"
      data-testid="mobile-top-bar"
      aria-label="Ouvrir la navigation"
      onClick={() => onToggle?.()}
    >
      <UserProfile showPageNavigation={false} />
    </button>
  );
}
