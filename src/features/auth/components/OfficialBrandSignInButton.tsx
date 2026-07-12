"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import styles from "@/features/auth/components/OfficialBrandSignInButton.module.css";

const PRESS_FEEDBACK_MS = 140;

type Props = {
  src: string;
  width: number;
  height: number;
  ariaLabel: string;
  dataTestId: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
};

/** Bouton OAuth image officielle (Google / Apple) — pleine largeur, feedback tactile. */
export default function OfficialBrandSignInButton({
  src,
  width,
  height,
  ariaLabel,
  dataTestId,
  onClick,
  disabled,
  busy = false,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const pendingOAuthRef = useRef(false);

  useEffect(() => {
    if (!busy) pendingOAuthRef.current = false;
  }, [busy]);

  const releasePress = useCallback(() => {
    if (!pendingOAuthRef.current) setPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || busy || pendingOAuthRef.current) return;
    pendingOAuthRef.current = true;
    setPressed(true);
    window.setTimeout(() => {
      onClick();
      pendingOAuthRef.current = false;
      setPressed(false);
    }, PRESS_FEEDBACK_MS);
  }, [busy, disabled, onClick]);

  return (
    <button
      type="button"
      data-testid={dataTestId}
      disabled={disabled || busy}
      onClick={handleClick}
      onPointerDown={() => {
        if (!disabled && !busy) setPressed(true);
      }}
      onPointerUp={releasePress}
      onPointerLeave={releasePress}
      onPointerCancel={releasePress}
      className={`${styles.root}${pressed ? ` ${styles.pressed}` : ""}`}
      aria-label={ariaLabel}
      aria-busy={busy}
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        className={styles.asset}
        priority
        unoptimized
      />
      {busy ? (
        <span className={styles.busyOverlay} aria-hidden>
          <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
        </span>
      ) : null}
    </button>
  );
}
