"use client";

import React, { useEffect, useRef } from "react";
import { startGalaxyStarsAnimation } from "@/core/ui/GalaxyButton/galaxyStarsAnimation";
import "./GalaxyButton.css";

interface GalaxyButtonProps {
  text?: string;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
  children?: React.ReactNode;
  /**
   * Si false : rend un div (pas de &lt;button&gt;), pour pouvoir imbriquer des contrôles interactifs
   * (ex. lecture) sans HTML invalide ni double zone cliquable.
   */
  asInteractiveButton?: boolean;
  /** Force le profil basse consommation. Omis = auto-détection via media query. */
  mobilePowerSave?: boolean;
}

const GalaxyButton: React.FC<GalaxyButtonProps> = ({
  text,
  onClick,
  onLongPress,
  className,
  children,
  asInteractiveButton = true,
  mobilePowerSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const setSurfaceRef = (el: HTMLButtonElement | HTMLDivElement | null) => {
    surfaceRef.current = el;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const btn = surfaceRef.current;
    if (!canvas || !btn) return;

    return startGalaxyStarsAnimation(canvas, btn, {
      variant: "dock",
      mobilePowerSave,
    });
  }, [asInteractiveButton, mobilePowerSave]);

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress?.();
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.();
  };

  const inner = (
    <>
      <canvas ref={canvasRef} id="stars-canvas"></canvas>
      <div className="btn-content">{children || text}</div>
    </>
  );

  return (
    <div className={`galaxy-button-container ${className || ""}`}>
      {asInteractiveButton ? (
        <button
          ref={setSurfaceRef}
          type="button"
          className="premium-btn"
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        >
          {inner}
        </button>
      ) : (
        <div
          ref={setSurfaceRef}
          className="premium-btn premium-btn--surface"
          role="presentation"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        >
          {inner}
        </div>
      )}
    </div>
  );
};

export default GalaxyButton;
