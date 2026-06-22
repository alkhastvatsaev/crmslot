"use client";
import React, { useMemo } from "react";
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
  const gridMissions = useMemo(() => missions.slice(0, DAILY_MISSIONS_GRID_SLOTS), [missions]);
  const trailingEmptySlots = DAILY_MISSIONS_GRID_SLOTS - gridMissions.length;

  const content = (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isEmbedded ? "min-h-0 flex-1" : GLASS_PANEL_BODY_SCROLL
      )}
    >
      <div
        className="grid shrink-0 grid-cols-3 gap-3 px-3 pb-6 pt-4 content-start [grid-template-columns:repeat(3,minmax(0,1fr))]"
        data-testid={isEmpty ? "daily-missions-empty-grid" : "daily-missions-grid"}
      >
        {gridMissions.map((mission) => {
          const tone = mission.statusCode
            ? dailyMissionCardToneFromStatus(mission.statusCode)
            : "upcoming";
          const isDone = tone === "done";
          const inProgress = tone === "active";

          const glow = isDone
            ? "0 0 15px rgba(40,224,90,0.1), 0 5px 20px rgba(40,224,90,0.08)"
            : inProgress
              ? "0 0 15px rgba(255,149,0,0.1), 0 5px 20px rgba(255,149,0,0.08)"
              : "0 0 15px rgba(0,0,0,0.05), 0 5px 20px rgba(0,0,0,0.04)";

          const cardShadow = `0 6px 18px -4px rgba(15,23,42,0.1), ${glow}`;

          const textGradient = isDone
            ? "from-green-500 via-emerald-600 to-teal-800"
            : "from-slate-700 via-slate-900 to-black";

          return (
            <button
              type="button"
              key={mission.key ?? String(mission.id)}
              onClick={() => onMissionClick && onMissionClick(mission)}
              data-testid={mission.key ? `daily-mission-${mission.key}` : undefined}
              style={{ boxShadow: cardShadow }}
              className="group relative w-full max-w-[95px] justify-self-center p-3 rounded-[24px] bg-white cursor-pointer flex flex-col items-center justify-center gap-1.5 aspect-square text-center active:scale-[0.97] transition-transform duration-150"
            >
              <h3
                className={`text-[14px] font-bold tracking-[-0.02em] leading-tight bg-gradient-to-br ${textGradient} bg-clip-text text-transparent`}
              >
                {mission.clientName}
              </h3>

              <div className="flex items-center opacity-100">
                <span
                  className={`text-[16px] font-medium tracking-[-0.01em] bg-gradient-to-br ${textGradient} bg-clip-text text-transparent`}
                >
                  {mission.time}
                </span>
              </div>
            </button>
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
        {content}
      </div>
    </div>
  );
}
