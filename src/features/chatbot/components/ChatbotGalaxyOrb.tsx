"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { startGalaxyStarsAnimation } from "@/core/ui/GalaxyButton/galaxyStarsAnimation";
import "@/core/ui/GalaxyButton/GalaxyButton.css";

const STAR_COUNT = 420;

/** Cercle avatar Chatbot 32×32 — même animation étoiles / fond bleu que GalaxyButton. */
export default function ChatbotGalaxyOrb({ className }: { className?: string }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    const canvas = canvasRef.current;
    if (!surface || !canvas) return;

    const start = () => {
      if (surface.offsetWidth < 2) return undefined;
      return startGalaxyStarsAnimation(canvas, surface, {
        starCount: STAR_COUNT,
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
  }, []);

  return (
    <div
      ref={surfaceRef}
      className={cn("chatbot-galaxy-orb shrink-0", className)}
      data-testid="chatbot-galaxy-orb"
      aria-hidden
    >
      <canvas ref={canvasRef} className="chatbot-galaxy-orb__canvas" />
    </div>
  );
}
