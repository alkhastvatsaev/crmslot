"use client";

import { useEffect, type RefObject } from "react";
import { bindMobileNestedScrollGesture } from "@/features/dashboard/mobileNestedScrollGesture";

export function useMobileNestedScrollGesture(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return bindMobileNestedScrollGesture(el);
  }, [ref]);
}
