/** Animation étoiles / fond bleu — partagée GalaxyButton + avatars Chatbot. */

import {
  resolveGalaxyAnimationProfile,
  type GalaxyAnimationProfile,
} from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";

export type GalaxyStarsOptions = {
  starCount?: number;
  interactive?: boolean;
  baseSpeed?: number;
  /** `avatar` = orbe 32px ; `dock` = bandeau Galaxy (défaut). */
  variant?: "dock" | "avatar";
  /** Profil ultra-léger (56 étoiles) — ex. assistant carte mobile. */
  mobilePowerSave?: boolean;
  powerProfile?: Partial<GalaxyAnimationProfile>;
};

type Star = {
  radius: number;
  angle: number;
  angularVelocity: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  z: number;
  color: { r: number; g: number; b: number };
};

const COLORS = [
  { r: 255, g: 255, b: 255 },
  { r: 255, g: 255, b: 255 },
  { r: 248, g: 250, b: 252 },
  { r: 241, g: 245, b: 249 },
  { r: 224, g: 242, b: 254 },
];

const GALAXY_TILT = 1.1;
const GALAXY_ANGLE = 0.3;

function paintGalaxyBackground(
  surface: HTMLElement,
  xPct: number,
  yPct: number,
  variant: "dock" | "avatar" = "dock"
) {
  if (variant === "avatar") {
    surface.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, #2563eb 0%, #172554 38%, rgba(23, 37, 84, 0.35) 52%, rgba(23, 37, 84, 0.08) 62%, transparent 72%)`;
  } else {
    surface.style.background = `radial-gradient(circle at ${xPct}% ${yPct}%, #3b82f6 0%, #1e3a8a 120%)`;
  }
}

export function startGalaxyStarsAnimation(
  canvas: HTMLCanvasElement,
  surface: HTMLElement,
  options: GalaxyStarsOptions = {}
): () => void {
  const profile = resolveGalaxyAnimationProfile({
    mobilePowerSave: options.mobilePowerSave,
    ...options.powerProfile,
  });
  const starCount = options.starCount ?? profile.starCount;
  const interactive = options.interactive ?? profile.interactive;
  const baseSpeed = options.baseSpeed ?? profile.baseSpeed;

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let speedMultiplier = 1;
  let targetSpeed = baseSpeed;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let animationFrameId = 0;
  let frameIndex = 0;
  let lastFrameAt = 0;
  let variant: "dock" | "avatar" = options.variant ?? "dock";
  let maxDrawRadius = Infinity;
  let depthZScale = 150;

  const minFrameMs = profile.maxFps > 0 ? 1000 / profile.maxFps : Infinity;
  const isCompactDock =
    (options.variant ?? "dock") === "dock" &&
    profile.maxFps > 0 &&
    profile.maxFps <= 20 &&
    starCount > 0 &&
    starCount <= 120;

  const scheduleNextFrame = () => {
    animationFrameId = requestAnimationFrame(animate);
  };

  const ensureAnimationRunning = () => {
    if (width < 2 || height < 2) return;
    if (profile.maxFps === 0 || starCount === 0) return;
    if (typeof document !== "undefined" && document.hidden) return;
    if (!animationFrameId) {
      lastFrameAt = 0;
      scheduleNextFrame();
    }
  };

  const initCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, profile.maxDevicePixelRatio);
    width = surface.offsetWidth;
    height = surface.offsetHeight;
    if (width < 2 || height < 2) return;

    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    targetX = currentX = width / 2;
    targetY = currentY = height / 2;

    stars = [];
    variant = options.variant ?? "dock";
    const mini = Math.min(width, height);
    const isAvatar = variant === "avatar";

    const baseRadius = isAvatar
      ? mini * 0.42
      : isCompactDock
        ? Math.max(mini * 2.2, width * 0.28)
        : Math.max(width, height) * 0.75;
    maxDrawRadius = isAvatar ? 0.45 : Infinity;
    depthZScale = isAvatar ? mini * 1.8 : isCompactDock ? mini * 2.4 : 150;

    const innerShare = isCompactDock ? 0.82 : 0.3;
    const innerRadiusScale = isCompactDock ? 0.9 : isAvatar ? 0.55 : 0.4;

    for (let i = 0; i < starCount; i += 1) {
      const radius =
        i < starCount * innerShare
          ? Math.sqrt(Math.random()) * (baseRadius * innerRadiusScale)
          : Math.random() * baseRadius;
      const angle = Math.random() * Math.PI * 2;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]!;

      const size = isAvatar
        ? Math.random() * 0.2 + 0.1
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
          ? Math.random() * 0.4 + 0.35
          : isCompactDock
            ? Math.random() * 0.35 + 0.45
            : Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01,
        z: (Math.random() - 0.5) * (isAvatar ? mini * 0.5 : isCompactDock ? mini * 0.9 : 60),
        color,
      });
    }

    paintGalaxyBackground(surface, 50, 50, isAvatar ? "avatar" : "dock");
    ensureAnimationRunning();
  };

  const animate = (now: number = performance.now()) => {
    animationFrameId = 0;

    if (profile.pauseWhenHidden && typeof document !== "undefined" && document.hidden) {
      return;
    }

    if (profile.maxFps === 0 || starCount === 0) {
      paintGalaxyBackground(surface, 50, 50, variant === "avatar" ? "avatar" : "dock");
      return;
    }

    if (lastFrameAt > 0 && now - lastFrameAt < minFrameMs) {
      scheduleNextFrame();
      return;
    }
    lastFrameAt = now;
    frameIndex += 1;

    ctx.clearRect(0, 0, width, height);

    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    speedMultiplier += (targetSpeed - speedMultiplier) * 0.05;

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
        const alpha = star.opacity * (0.3 + twinkle * 0.7) * Math.min(1, depthScale);
        const c = star.color;
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, alpha)})`;
        ctx.fill();
      }
    }

    if (width > 0 && height > 0 && frameIndex % Math.max(1, profile.backgroundEveryNFrames) === 0) {
      const xPct = (currentX / width) * 100;
      const yPct = (currentY / height) * 100;
      paintGalaxyBackground(surface, xPct, yPct, variant === "avatar" ? "avatar" : "dock");
    }

    scheduleNextFrame();
  };

  const pointTargetFromClient = (clientX: number, clientY: number) => {
    const rect = surface.getBoundingClientRect();
    targetX = clientX - rect.left;
    targetY = clientY - rect.top;
  };

  const handleMouseEnter = () => {
    targetSpeed = baseSpeed * 4;
  };

  const handleMouseMove = (e: Event) => {
    const me = e as MouseEvent;
    pointTargetFromClient(me.clientX, me.clientY);
  };

  const handleMouseLeave = () => {
    targetSpeed = baseSpeed;
    targetX = width / 2;
    targetY = height / 2;
  };

  const handleTouchStart = (e: Event) => {
    const touch = (e as TouchEvent).touches[0];
    if (!touch) return;
    targetSpeed = baseSpeed * 4;
    pointTargetFromClient(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: Event) => {
    const touch = (e as TouchEvent).touches[0];
    if (!touch) return;
    pointTargetFromClient(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleMouseLeave();
  };

  if (interactive) {
    surface.addEventListener("mouseenter", handleMouseEnter);
    surface.addEventListener("mousemove", handleMouseMove);
    surface.addEventListener("mouseleave", handleMouseLeave);
    surface.addEventListener("touchstart", handleTouchStart, { passive: true });
    surface.addEventListener("touchmove", handleTouchMove, { passive: true });
    surface.addEventListener("touchend", handleTouchEnd);
    surface.addEventListener("touchcancel", handleTouchEnd);
  }

  const onResize = () => initCanvas();
  window.addEventListener("resize", onResize);

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          initCanvas();
        })
      : null;
  resizeObserver?.observe(surface);

  const onVisibilityChange = () => {
    if (!profile.pauseWhenHidden) return;
    if (document.hidden) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
      return;
    }
    ensureAnimationRunning();
  };
  if (profile.pauseWhenHidden && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  const intersectionObserver =
    profile.pauseWhenHidden && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            const visible = entries[0]?.isIntersecting ?? true;
            if (!visible) {
              if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = 0;
              }
            } else {
              ensureAnimationRunning();
            }
          },
          { threshold: 0.01, rootMargin: "8px" }
        )
      : null;
  intersectionObserver?.observe(surface);

  paintGalaxyBackground(surface, 50, 50, options.variant === "avatar" ? "avatar" : "dock");
  initCanvas();
  ensureAnimationRunning();

  const layoutKickId = window.requestAnimationFrame(() => {
    initCanvas();
    ensureAnimationRunning();
  });

  return () => {
    window.cancelAnimationFrame(layoutKickId);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (interactive) {
      surface.removeEventListener("mouseenter", handleMouseEnter);
      surface.removeEventListener("mousemove", handleMouseMove);
      surface.removeEventListener("mouseleave", handleMouseLeave);
      surface.removeEventListener("touchstart", handleTouchStart);
      surface.removeEventListener("touchmove", handleTouchMove);
      surface.removeEventListener("touchend", handleTouchEnd);
      surface.removeEventListener("touchcancel", handleTouchEnd);
    }
    window.removeEventListener("resize", onResize);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    if (profile.pauseWhenHidden && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}
