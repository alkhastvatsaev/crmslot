"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  title?: string;
};

/** Verrou gradient CRMSLOT — SVG inline pour rendu net (sans rasterisation Next/Image). */
export default function CrmslotLockMark({ className, title = "CRMSLOT" }: Props) {
  const uid = useId().replace(/:/g, "");
  const lockGrad = `crmslot-lock-grad-${uid}`;
  const lockStroke = `crmslot-lock-stroke-${uid}`;
  const lockShadow = `crmslot-lock-shadow-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="180 115 155 300"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("h-11 w-9 shrink-0", className)}
    >
      <defs>
        <linearGradient
          id={lockGrad}
          x1="256"
          y1="128"
          x2="256"
          y2="406"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F5F5F4" />
          <stop offset="35%" stopColor="#D6D3D1" />
          <stop offset="62%" stopColor="#A8A29E" />
          <stop offset="100%" stopColor="#57534E" />
        </linearGradient>
        <linearGradient
          id={lockStroke}
          x1="210"
          y1="130"
          x2="300"
          y2="410"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#A8A29E" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#44403C" stopOpacity="0.42" />
        </linearGradient>
        <filter id={lockShadow} x="-25%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="10" floodColor="#78716C" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#${lockShadow})`}>
        <path
          d="M 256 128 A 86 86 0 0 1 308 282.4 L 308 354 A 52 52 0 0 1 256 406 A 52 52 0 0 1 204 354 L 204 282.4 A 86 86 0 0 1 256 128 Z"
          fill={`url(#${lockGrad})`}
          stroke={`url(#${lockStroke})`}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          paintOrder="stroke fill"
        />
      </g>
    </svg>
  );
}
