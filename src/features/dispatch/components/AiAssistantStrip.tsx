"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Square } from "lucide-react";
import GalaxyButton from "@/core/ui/GalaxyButton/GalaxyButton";
import {
  DASHBOARD_DESKTOP_GALAXY_STRIP_CLASS,
  DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import { AI_STRIP_EDGE_INSET_PX } from "@/features/dispatch/aiStripAnchor";
import { useAiStripInsetRect } from "@/features/dispatch/useAiStripInsetRect";

type AiAssistantStripProps = {
  dockLayout?: boolean;
  isPlaying: boolean;
  queueLength: number;
  transcriptOverlayVisible?: boolean;
  onTogglePlayback: (e: React.SyntheticEvent) => void;
  onUserLongPress?: () => void;
  mobilePowerSave?: boolean;
};

export default function AiAssistantStrip({
  dockLayout = false,
  isPlaying,
  queueLength,
  transcriptOverlayVisible = false,
  onTogglePlayback,
  onUserLongPress,
  mobilePowerSave,
}: AiAssistantStripProps) {
  const mapPanelRect = useAiStripInsetRect();

  const stripInsetTotal = AI_STRIP_EDGE_INSET_PX * 2;
  const stripFallbackWidth = `calc(min(var(--dashboard-stack-max-width), calc(100vw - 2 * var(--dashboard-canvas-pad-x))) - ${stripInsetTotal}px)`;

  const stripPositionStyle: React.CSSProperties | undefined = dockLayout
    ? undefined
    : mapPanelRect != null
      ? {
          left: mapPanelRect.left,
          width: mapPanelRect.width,
          minWidth: mapPanelRect.width,
          maxWidth: mapPanelRect.width,
          transform: "none",
        }
      : {
          left: "50%",
          width: stripFallbackWidth,
          minWidth: stripFallbackWidth,
          maxWidth: stripFallbackWidth,
          transform: "translateX(-50%)",
        };

  const showBadge = queueLength > 0;
  const showTransportControl = queueLength > 0 || isPlaying || transcriptOverlayVisible;

  return (
    <AnimatePresence>
      <motion.div
        data-testid="ai-assistant-strip"
        className={`${DASHBOARD_DESKTOP_GALAXY_STRIP_CLASS} box-border flex min-w-0 flex-col items-stretch`}
        style={stripPositionStyle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20, pointerEvents: "none" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div
          className={`relative ${DASHBOARD_DESKTOP_GALAXY_STRIP_INNER_CLASS} shrink-0 transition-all duration-500 ease-out hover:scale-[1.02] ${showBadge ? "scale-[1.02]" : ""}`}
          onContextMenu={(e) => {
            e.preventDefault();
            onUserLongPress?.();
          }}
        >
          {showBadge ? (
            <div
              data-testid="ai-queue-badge"
              className="pointer-events-none absolute top-1/2 right-6 z-[6] -translate-y-1/2 text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
            >
              {queueLength}
            </div>
          ) : null}
          <GalaxyButton
            asInteractiveButton={false}
            {...(mobilePowerSave !== undefined ? { mobilePowerSave } : {})}
            className={`h-full w-full ${showBadge ? "notified" : ""}`}
          >
            <AnimatePresence initial={false}>
              {showTransportControl ? (
                <motion.div
                  key="ai-assistant-transport"
                  role="button"
                  tabIndex={0}
                  data-testid="ai-assistant-play-toggle"
                  onClick={onTogglePlayback}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onTogglePlayback(e);
                    }
                  }}
                  initial={{ opacity: 0, scale: 0.75, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.78, x: -8 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.65 }}
                  className="pointer-events-auto absolute top-1/2 left-3 z-[5] flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-white shadow-none outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  aria-label={isPlaying ? "Pause" : "Lecture"}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isPlaying ? (
                      <motion.span
                        key="stop"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
                      >
                        <Square className="h-5 w-5 fill-current" strokeWidth={0} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="play"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
                      >
                        <Play className="h-6 w-6 fill-current" strokeWidth={0} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </GalaxyButton>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
