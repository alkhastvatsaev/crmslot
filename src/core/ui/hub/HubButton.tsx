"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { hubButtonClassName, type HubButtonVariant } from "@/core/ui/hub/hubButtonClassName";

export type { HubButtonVariant } from "@/core/ui/hub/hubButtonClassName";
export { hubButtonClassName } from "@/core/ui/hub/hubButtonClassName";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: HubButtonVariant;
  fullWidth?: boolean;
  emphasis?: boolean;
};

export default function HubButton({
  children,
  variant = "primary",
  fullWidth = false,
  emphasis = false,
  className,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={hubButtonClassName({ variant, fullWidth, emphasis, className })}
      {...rest}
    >
      {children}
    </button>
  );
}
