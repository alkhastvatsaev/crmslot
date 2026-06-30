/** Helpers peinture / génération étoiles — galaxyStarsAnimation. */

import {
  GALAXY_ANGLE,
  GALAXY_STAR_COLORS,
  GALAXY_TILT,
  type GalaxyStar,
  type GalaxyStarsVariant,
} from "@/core/ui/GalaxyButton/galaxyStarsAnimationTypes";

export function paintGalaxyBackground(
  surface: HTMLElement,
  xPct: number,
  yPct: number,
  variant: GalaxyStarsVariant = "dock"
) {
  if (variant === "avatar") {
    surface.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, rgba(191, 219, 254, 0.92) 0%, #60a5fa 6%, #3b82f6 16%, #2563eb 30%, #1d4ed8 44%, #1e3a8a 56%, rgba(23, 37, 84, 0.72) 68%, rgba(15, 23, 42, 0.38) 78%, rgba(15, 23, 42, 0.14) 88%, rgba(15, 23, 42, 0.04) 95%, transparent 100%)`;
  } else {
    surface.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, #3b82f6 0%, #1e3a8a 120%)`;
  }
}

export type CreateGalaxyStarsParams = {
  starCount: number;
  width: number;
  height: number;
  variant: GalaxyStarsVariant;
  isCompactDock: boolean;
};

export function createGalaxyStars({
  starCount,
  width,
  height,
  variant,
  isCompactDock,
}: CreateGalaxyStarsParams): {
  stars: GalaxyStar[];
  maxDrawRadius: number;
  depthZScale: number;
} {
  const stars: GalaxyStar[] = [];
  const mini = Math.min(width, height);
  const isAvatar = variant === "avatar";

  const baseRadius = isAvatar
    ? mini * 0.42
    : isCompactDock
      ? Math.max(mini * 2.2, width * 0.28)
      : Math.max(width, height) * 0.75;
  const maxDrawRadius = isAvatar ? 0.45 : Infinity;
  const depthZScale = isAvatar ? mini * 1.8 : isCompactDock ? mini * 2.4 : 150;

  const innerShare = isCompactDock ? 0.82 : 0.3;
  const innerRadiusScale = isCompactDock ? 0.9 : isAvatar ? 0.55 : 0.4;

  for (let i = 0; i < starCount; i += 1) {
    const radius =
      i < starCount * innerShare
        ? Math.sqrt(Math.random()) * (baseRadius * innerRadiusScale)
        : Math.random() * baseRadius;
    const angle = Math.random() * Math.PI * 2;
    const color = GALAXY_STAR_COLORS[Math.floor(Math.random() * GALAXY_STAR_COLORS.length)]!;

    const size = isAvatar
      ? Math.random() * 0.32 + 0.14
      : isCompactDock
        ? Math.random() * 0.55 + 0.35
        : Math.random() * 0.4 + 0.1;

    stars.push({
      radius,
      angle,
      angularVelocity:
        (0.001 + Math.random() * 0.002) *
        (1 / (1 + radius * (isCompactDock ? 0.012 : isAvatar ? 0.008 : 0.002))) *
        (isCompactDock ? 2 : 1),
      size,
      opacity: isAvatar
        ? Math.random() * 0.32 + 0.42
        : isCompactDock
          ? Math.random() * 0.35 + 0.45
          : Math.random() * 0.6 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      z: (Math.random() - 0.5) * (isAvatar ? mini * 0.5 : isCompactDock ? mini * 0.9 : 60),
      color,
    });
  }

  return { stars, maxDrawRadius, depthZScale };
}

export type DrawGalaxyStarsParams = {
  ctx: CanvasRenderingContext2D;
  stars: GalaxyStar[];
  width: number;
  height: number;
  currentX: number;
  currentY: number;
  speedMultiplier: number;
  maxDrawRadius: number;
  depthZScale: number;
  now: number;
  /** Fondu doux en bordure — orbe chatbot. */
  softEdge?: boolean;
};

export function drawGalaxyStars({
  ctx,
  stars,
  width,
  height,
  currentX,
  currentY,
  speedMultiplier,
  maxDrawRadius,
  depthZScale,
  now,
  softEdge = false,
}: DrawGalaxyStarsParams) {
  const mini = Math.min(width, height);
  const edgeRadius = mini * 0.5;

  for (const star of stars) {
    star.angle += star.angularVelocity * speedMultiplier;

    const x = Math.cos(star.angle) * star.radius;
    const y = Math.sin(star.angle) * star.radius;
    const z = star.z;

    const y1 = y * Math.cos(GALAXY_TILT) - z * Math.sin(GALAXY_TILT);
    const z1 = y * Math.sin(GALAXY_TILT) + z * Math.cos(GALAXY_TILT);

    const x2 = x * Math.cos(GALAXY_ANGLE) - y1 * Math.sin(GALAXY_ANGLE);
    const y2 = x * Math.sin(GALAXY_ANGLE) + y1 * Math.cos(GALAXY_ANGLE);

    const finalX = currentX + x2;
    const finalY = currentY + y2;

    if (finalX >= -50 && finalX <= width + 50 && finalY >= -50 && finalY <= height + 50) {
      const depthScale = (z1 + depthZScale) / depthZScale;
      const finalSize = Math.min(maxDrawRadius, Math.max(0.04, star.size * depthScale));

      ctx.beginPath();
      ctx.arc(finalX, finalY, finalSize, 0, Math.PI * 2);

      const twinkle = (Math.sin(now * 0.002 * star.twinkleSpeed) + 1) * 0.5;
      let alpha = star.opacity * (0.3 + twinkle * 0.7) * Math.min(1, depthScale);

      if (softEdge && edgeRadius > 0) {
        const dx = finalX - currentX;
        const dy = finalY - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy) / edgeRadius;
        const edge = Math.max(0, Math.min(1, (dist - 0.42) / 0.58));
        alpha *= 1 - edge * edge * (3 - 2 * edge);
      }

      const c = star.color;
      ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, alpha)})`;
      ctx.fill();
    }
  }
}
