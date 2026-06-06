"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { startGalaxyStarsAnimation } from "@/core/ui/GalaxyButton/galaxyStarsAnimation";
import "@/core/ui/GalaxyButton/GalaxyButton.css";

const STAR_COUNT_SM = 420;
const STAR_COUNT_HERO = 720;

type Props = {
  className?: string;
  /** `hero` = orbe vide au démarrage (~83 px) ; défaut = bulles (32 px). */
  size?: "sm" | "hero";
};

/** Cercle avatar Chatbot — animation étoiles / fond bleu (GalaxyButton). */
export default function ChatbotGalaxyOrb({ className, size = "sm" }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHero = size === "hero";

  useEffect(() => {
    const surface = surfaceRef.current;
    const canvas = canvasRef.current;
    if (!surface || !canvas) return;

    const start = () => {
      if (surface.offsetWidth < 2) return undefined;
      return startGalaxyStarsAnimation(canvas, surface, {
        starCount: isHero ? STAR_COUNT_HERO : STAR_COUNT_SM,
        interactive: false,
        baseSpeed: 1.1,
        variant: "avatar",
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

  return (
    <div
      ref={surfaceRef}
      className={cn("chatbot-galaxy-orb shrink-0", isHero && "chatbot-galaxy-orb--hero", className)}
      data-testid="chatbot-galaxy-orb"
      data-size={size}
      aria-hidden
    >
      <canvas ref={canvasRef} className="chatbot-galaxy-orb__canvas" />
    </div>
  );
}
