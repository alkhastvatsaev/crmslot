import type { MutableRefObject } from "react";
import mapboxgl from "mapbox-gl";
import { dailyMissionCardToneFromStatus } from "@/features/interventions/technicianSchedule";
import { markerGlowBlurClass } from "@/features/map/mapboxPowerProfile";
import type { Mission } from "@/features/map/missionTypes";

type CreateMarkerArgs = {
  mission: Mission;
  index: number;
  isMobile: boolean;
  onSelect: (mission: Mission) => void;
  onFlyTo: (center: [number, number]) => void;
};

export function createMapMissionMarkerElement({
  mission,
  index,
  isMobile,
  onSelect,
  onFlyTo,
}: CreateMarkerArgs): HTMLDivElement {
  const isLive = mission.source === "live";
  const tone = mission.statusCode ? dailyMissionCardToneFromStatus(mission.statusCode) : "upcoming";
  const isDone = tone === "done";
  const inProgress = tone === "active";

  const shadowClass = isDone
    ? "shadow-[0_0_10px_rgba(40,224,90,0.65),0_6px_20px_rgba(40,224,90,0.75)]"
    : inProgress
      ? "shadow-[0_0_10px_rgba(255,149,0,0.65),0_6px_20px_rgba(255,149,0,0.75)]"
      : isLive
        ? "shadow-[0_0_12px_rgba(59,130,246,0.70),0_8px_26px_rgba(59,130,246,0.65)]"
        : "shadow-[0_0_10px_rgba(255,59,48,0.65),0_6px_20px_rgba(255,59,48,0.75)]";

  const textGradient = isDone
    ? "from-green-500 via-emerald-600 to-teal-800"
    : inProgress
      ? "from-amber-400 via-orange-500 to-rose-600"
      : isLive
        ? "from-sky-400 via-blue-600 to-indigo-800"
        : "from-red-500 via-rose-600 to-red-800";

  const borderClass = isDone
    ? "border-[1.5px] border-solid border-emerald-500"
    : inProgress
      ? "border-[1.5px] border-solid border-orange-500"
      : isLive
        ? "border-[1.5px] border-solid border-blue-500"
        : "border-[1.5px] border-solid border-red-500";

  const el = document.createElement("div");
  el.className = "custom-marker-container relative";

  const glow = document.createElement("div");
  const glowColor = isDone
    ? "rgba(40,224,90,0.45)"
    : inProgress
      ? "rgba(255,149,0,0.45)"
      : isLive
        ? "rgba(59,130,246,0.50)"
        : "rgba(255,59,48,0.45)";
  glow.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full ${markerGlowBlurClass(isMobile)} transition-all duration-500`;
  glow.style.backgroundColor = glowColor;
  el.appendChild(glow);

  const inner = document.createElement("div");
  inner.className = `relative flex items-center justify-center w-5 h-5 rounded-[6px] bg-white/95 backdrop-blur-xl transition-transform duration-[400ms] ease-out cursor-pointer ${shadowClass} ${borderClass}`;

  const textSpan = document.createElement("span");
  textSpan.className = `text-[10px] font-bold bg-gradient-to-br ${textGradient} bg-clip-text text-transparent leading-none`;
  textSpan.innerText = (index + 1).toString();

  inner.appendChild(textSpan);
  el.appendChild(inner);

  el.addEventListener("mouseenter", () => {
    inner.style.transform = "scale(1.15)";
  });
  el.addEventListener("mouseleave", () => {
    inner.style.transform = "scale(1)";
  });

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect(mission);
    onFlyTo(mission.coordinates as [number, number]);
  });

  return el;
}

export function syncMapMissionMarkers(
  map: mapboxgl.Map,
  missions: Mission[],
  isMobile: boolean,
  markersRef: MutableRefObject<Record<string, mapboxgl.Marker>>,
  onSelectMission: (mission: Mission) => void,
  onFlyTo: (center: [number, number]) => void,
  isValidCoords: (coords: [number, number]) => boolean
) {
  Object.values(markersRef.current).forEach((marker) => marker.remove());
  markersRef.current = {};

  missions.forEach((mission, index) => {
    const coords = mission.coordinates as [number, number];
    if (!isValidCoords(coords)) return;

    const el = createMapMissionMarkerElement({
      mission,
      index,
      isMobile,
      onSelect: onSelectMission,
      onFlyTo,
    });

    const marker = new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(map);
    markersRef.current[mission.key ?? String(mission.id)] = marker;
  });
}
