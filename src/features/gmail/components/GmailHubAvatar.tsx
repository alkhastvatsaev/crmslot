"use client";

import { cn } from "@/lib/utils";
import {
  avatarPalette,
  initialsFromString,
  parseSenderName,
} from "@/features/gmail/gmailHubUi";

type Props = {
  seed: string;
  size?: "sm" | "md";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-[11px]",
  md: "h-11 w-11 text-[12px]",
};

export default function GmailHubAvatar({ seed, size = "sm", className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.35)]",
        avatarPalette(seed),
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initialsFromString(parseSenderName(seed))}
    </span>
  );
}
