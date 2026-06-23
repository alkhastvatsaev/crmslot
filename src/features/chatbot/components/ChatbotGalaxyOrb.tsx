"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { startGalaxyStarsAnimation } from "@/core/ui/GalaxyButton/galaxyStarsAnimation";
import "@/core/ui/GalaxyButton/GalaxyButton.css";
import { isMobilePowerSaveClient } from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";

const STAR_COUNT_SM = 60;
const STAR_COUNT_HERO = 180;
const STAR_COUNT_MOBILE = 72;

type Props = {
  className?: string;
  /** `hero` = orbe vide au démarrage (~83 px) ; défaut = bulles (32 px). */
  size?: "sm" | "hero";
  /** Ouvre le dock Galaxy mobile (saisie chatbot). */
  onPress?: () => void;
};

/** Cercle avatar Chatbot — animation étoiles / fond bleu (GalaxyButton). */
export default function ChatbotGalaxyOrb({ className, size = "sm", onPress }: Props) {
  const surfaceRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHero = size === "hero";
  const interactive = Boolean(onPress);

  useEffect(() => {
    const surface = surfaceRef.current;
    const canvas = canvasRef.current;
    if (!surface || !canvas) return;

    const start = () => {
      if (surface.offsetWidth < 2) return undefined;
      const mobile = isMobilePowerSaveClient();
      return startGalaxyStarsAnimation(canvas, surface, {
        starCount: mobile ? STAR_COUNT_MOBILE : isHero ? STAR_COUNT_HERO : STAR_COUNT_SM,
        interactive: false,
        baseSpeed: mobile ? 0.55 : 1.1,
        variant: "avatar",
        mobilePowerSave: mobile,
      });
    };

    let cleanup = start();
    const id = window.requestAnimationFrame(() => {
      cleanup?.();
      cleanup = start();
    });

    return () => {
      window.cancelAnimationFrame(id);
      cleanup?.();
    };
  }, [isHero]);

  const surface = (
    <>
      <canvas ref={canvasRef} className="chatbot-galaxy-orb__canvas" />
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        ref={surfaceRef as React.RefObject<HTMLButtonElement>}
        className={cn(
          "chatbot-galaxy-orb shrink-0",
          isHero && "chatbot-galaxy-orb--hero",
          "cursor-pointer border-0 bg-transparent p-0",
          className
        )}
        data-testid="chatbot-galaxy-orb"
        data-size={size}
        aria-label="Ouvrir la saisie"
        onClick={onPress}
      >
        {surface}
      </button>
    );
  }

  return (
    <div
      ref={surfaceRef as React.RefObject<HTMLDivElement>}
      className={cn("chatbot-galaxy-orb shrink-0", isHero && "chatbot-galaxy-orb--hero", className)}
      data-testid="chatbot-galaxy-orb"
      data-size={size}
      aria-hidden
    >
      {surface}
    </div>
  );
}
