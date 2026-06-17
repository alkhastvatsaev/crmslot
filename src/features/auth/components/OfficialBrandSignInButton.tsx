"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
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
}: Props) {
  const [pressed, setPressed] = useState(false);
  const pendingOAuthRef = useRef(false);

  const releasePress = useCallback(() => {
    if (!pendingOAuthRef.current) setPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || pendingOAuthRef.current) return;
    pendingOAuthRef.current = true;
    setPressed(true);
    window.setTimeout(() => {
      onClick();
    }, PRESS_FEEDBACK_MS);
  }, [disabled, onClick]);

  return (
    <button
      type="button"
      data-testid={dataTestId}
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={() => {
        if (!disabled) setPressed(true);
      }}
      onPointerUp={releasePress}
      onPointerLeave={releasePress}
      onPointerCancel={releasePress}
      className={`${styles.root}${pressed ? ` ${styles.pressed}` : ""}`}
      aria-label={ariaLabel}
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
    </button>
  );
}
