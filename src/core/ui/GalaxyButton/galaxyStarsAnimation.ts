/** Animation étoiles / fond bleu — partagée GalaxyButton + avatars Chatbot. */

import { resolveGalaxyAnimationProfile } from "@/core/ui/GalaxyButton/galaxyAnimationPowerPolicy";
import {
  createGalaxyStars,
  drawGalaxyStars,
  paintGalaxyBackground,
} from "@/core/ui/GalaxyButton/galaxyStarsAnimationHelpers";
import type {
  GalaxyStar,
  GalaxyStarsOptions,
} from "@/core/ui/GalaxyButton/galaxyStarsAnimationTypes";

export type { GalaxyStarsOptions } from "@/core/ui/GalaxyButton/galaxyStarsAnimationTypes";

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
  ctx.imageSmoothingEnabled = true;

  let width = 0;
  let height = 0;
  let stars: GalaxyStar[] = [];
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

    variant = options.variant ?? "dock";
    const isAvatar = variant === "avatar";

    const starBundle = createGalaxyStars({
      starCount,
      width,
      height,
      variant,
      isCompactDock,
    });
    stars = starBundle.stars;
    maxDrawRadius = starBundle.maxDrawRadius;
    depthZScale = starBundle.depthZScale;

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

    drawGalaxyStars({
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
      softEdge: variant === "avatar",
    });

    if (
      width > 0 &&
      height > 0 &&
      interactive &&
      frameIndex % Math.max(1, profile.backgroundEveryNFrames) === 0
    ) {
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
