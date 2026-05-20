"use client";
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { Mission } from "@/features/map/missionTypes";
import { dailyMissionCardToneFromStatus } from "@/features/interventions/technicianSchedule";
import {
  DASHBOARD_PANEL_CHROME_BLUR,
  DASHBOARD_PANEL_CHROME_BORDER,
  DASHBOARD_PANEL_CHROME_ROUNDED,
  DASHBOARD_PANEL_SHADOW_CLASS,
  GLASS_PANEL_BODY_SCROLL,
} from "@/core/ui/glassPanelChrome";
import { cn } from "@/lib/utils";

const DAILY_MISSIONS_GRID_SLOTS = 12;

function DailyMissionEmptySlot({ index }: { index: number }) {
  return (
    <div
      key={`empty-slot-${index}`}
      data-testid={`daily-missions-empty-slot-${index}`}
      aria-hidden
      className="aspect-square w-full max-w-[95px] justify-self-center rounded-[24px] border border-black/[0.06] bg-white/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),0_4px_14px_-6px_rgba(15,23,42,0.08)]"
    />
  );
}

export default function DailyMissions({
  missions: missionsProp,
  onMissionClick,
  isEmbedded = false,
}: {
  missions?: Mission[];
  onMissionClick?: (mission: Mission) => void;
  isEmbedded?: boolean;
}) {
  const missions = useMemo(() => missionsProp ?? [], [missionsProp]);
  const isEmpty = missions.length === 0;
  const gridMissions = useMemo(
    () => missions.slice(0, DAILY_MISSIONS_GRID_SLOTS),
    [missions],
  );
  const trailingEmptySlots = DAILY_MISSIONS_GRID_SLOTS - gridMissions.length;

  const content = (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isEmbedded ? "min-h-0 flex-1" : GLASS_PANEL_BODY_SCROLL,
      )}
    >
      <div
        className="grid shrink-0 grid-cols-3 gap-3 px-3 pb-6 pt-4 content-start [grid-template-columns:repeat(3,minmax(0,1fr))]"
        data-testid={isEmpty ? "daily-missions-empty-grid" : "daily-missions-grid"}
      >
          {gridMissions.map((mission, index) => {
            const tone = mission.statusCode
              ? dailyMissionCardToneFromStatus(mission.statusCode)
              : "upcoming";
            const isDone = tone === "done";
            const inProgress = tone === "active";
            
            const baseShadow = '0 6px 18px -4px rgba(15,23,42,0.1)';
            
            const activeGlow = isDone 
              ? '0 0 15px rgba(40,224,90,0.1), 0 5px 20px rgba(40,224,90,0.08)' 
              : inProgress
                ? '0 0 15px rgba(255,149,0,0.1), 0 5px 20px rgba(255,149,0,0.08)'
                : '0 0 15px rgba(0,0,0,0.05), 0 5px 20px rgba(0,0,0,0.04)';
                
            const transparentGlow = isDone
              ? '0 0 15px rgba(40,224,90,0), 0 5px 20px rgba(40,224,90,0)'
              : inProgress
                ? '0 0 15px rgba(255,149,0,0), 0 5px 20px rgba(255,149,0,0)'
                : '0 0 15px rgba(0,0,0,0), 0 5px 20px rgba(0,0,0,0)';

            const fullShadow = `${baseShadow}, ${activeGlow}`;
            const offShadow = `${baseShadow}, ${transparentGlow}`;
                
            const textGradient = isDone
              ? 'from-green-500 via-emerald-600 to-teal-800'
              : inProgress
                ? 'from-amber-400 via-orange-500 to-rose-600'
                : 'from-slate-600 via-slate-800 to-black';
            
            return (
              <motion.div
                key={mission.key ?? String(mission.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: [1, 1, 1.02, 1],
                  boxShadow: [offShadow, offShadow, fullShadow, offShadow],
                }}
                transition={{
                  boxShadow: {
                    duration: 15,
                    repeat: Infinity,
                    times: [0, 0.666, 0.833, 1],
                    ease: "easeInOut",
                  },
                  scale: {
                    duration: 15,
                    repeat: Infinity,
                    times: [0, 0.666, 0.833, 1],
                    ease: "easeInOut",
                  },
                  opacity: { duration: 0.4, delay: index * 0.1 },
                }}
                onClick={() => onMissionClick && onMissionClick(mission)}
                className={`group relative w-full max-w-[95px] justify-self-center p-3 rounded-[24px] bg-white/95 backdrop-blur-xl transition-all duration-[400ms] ease-out cursor-pointer flex flex-col items-center justify-center gap-1.5 aspect-square text-center hover:scale-[1.02] active:scale-[0.96]`}
              >
                <h3 className={`text-[14px] font-bold tracking-[-0.02em] leading-tight bg-gradient-to-br ${textGradient} bg-clip-text text-transparent`}>
                  {mission.clientName}
                </h3>
                
                <div className="flex items-center opacity-100">
                  <span className={`text-[16px] font-medium tracking-[-0.01em] bg-gradient-to-br ${textGradient} bg-clip-text text-transparent`}>{mission.time}</span>
                </div>
              </motion.div>
            );
          })}
          {trailingEmptySlots > 0
            ? Array.from({ length: trailingEmptySlots }, (_, i) => (
                <DailyMissionEmptySlot key={`trailing-empty-${i}`} index={gridMissions.length + i} />
              ))
            : null}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div
      className={`flex h-full w-full flex-col ${DASHBOARD_PANEL_CHROME_ROUNDED} ${DASHBOARD_PANEL_CHROME_BORDER} bg-white/70 ${DASHBOARD_PANEL_SHADOW_CLASS} ${DASHBOARD_PANEL_CHROME_BLUR} transition-all duration-500`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">{content}</div>
    </div>
  );
}
