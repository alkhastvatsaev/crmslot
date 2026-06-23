import type { LucideIcon } from "lucide-react";

export type BidirectionalSlideOutcome = "idle" | "accept" | "decline";

export interface BidirectionalSlideActionProps {
  onAccept: () => void | Promise<void>;
  onDecline: () => void | Promise<void>;
  acceptLabel?: string;
  declineLabel?: string;
  className?: string;
  testId?: string;
  disabled?: boolean;
}

export interface SlideActionProps {
  onAction: () => void;
  label?: string;
  icon?: LucideIcon;
  className?: string;
  testId?: string;
  disabled?: boolean;
  variant?: "glass" | "field" | "premium";
  /** Hauteur réduite (panneau technicien). */
  compact?: boolean;
}
