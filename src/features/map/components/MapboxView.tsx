"use client";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { motion, AnimatePresence } from "framer-motion";
import { Archive, Trash2 } from "lucide-react";
import TourOptimizeButton from "@/features/technicians/components/TourOptimizeButton";
import { doc, deleteDoc } from "firebase/firestore";
import { firestore } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { toast } from "sonner";
import DailyMissions from "@/features/dashboard/components/DailyMissions";
import BackOfficeInboxPanel from "@/features/backoffice/components/BackOfficeInboxPanel";
import RequesterTrackingPanel from "@/features/interventions/components/RequesterTrackingPanel";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDateContext } from "@/context/DateContext";
import type { Mission } from "@/features/map/missionTypes";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { useBackofficeInboxIntentOptional } from "@/context/BackofficeInboxIntentContext";
import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useTechnicianAssignments } from "@/features/interventions/useTechnicianAssignments";
import {
  interventionClientLabel,
  statusLabelKey,
  formatScheduledTimeOnly,
  dailyMissionCardToneFromStatus,
  interventionMatchesTab,
  interventionVisibleInTechnicianMissionList,
  isInterventionReleasedToTechnicianField,
  isInterventionVisibleOnTechnicianMap,
} from "@/features/interventions/technicianSchedule";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  applyMapboxPremiumBasemapConfig,
  isMapWebGLActive,
  markerGlowBlurClass,
  resolveMapboxInitOptions,
  resolveMapboxMapRuntimeOptions,
  resolveMapCameraDuration,
} from "@/features/map/mapboxPowerProfile";
import {
  markMapboxPerf,
  measureMapboxPerf,
  resolveMapboxDeviceTier,
} from "@/features/map/mapboxDeviceProfile";
import {
  destroyMapboxMap,
  pauseMapboxMap,
  resolveMapboxLifecycleMode,
  resolveMapboxPauseOptions,
  resumeMapboxMap,
  scheduleMapboxResizeBurst,
} from "@/features/map/mapboxMapLifecycle";
import { resolveMapboxStyleSlug, resolveMapboxStyleUrl } from "@/features/map/mapboxStyleUrl";
import { configureMapboxWebView } from "@/features/map/configureMapboxWebView";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useMobileMapRenderGate } from "@/features/map/useMobileMapRenderGate";
import { useNativeUserLocation } from "@/features/map/hooks/useNativeUserLocation";
import { useMobileHubLayout } from "@/context/LayoutShellContext";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import MobileHubLayout from "@/features/dashboard/components/MobileHubLayout";
import type { MobileHubRail } from "@/features/dashboard/dashboardMobileNav";
import { useRequestMobileHubRail } from "@/features/dashboard/MobileHubRailContext";
import { missionStableKey } from "@/features/map/missionStableKey";
import { useMapArchivedMissions } from "@/features/map/useMapArchivedMissions";
import {
  DASHBOARD_DESKTOP_COL_CLASS,
  DASHBOARD_DESKTOP_GRID_CLASS,
  DASHBOARD_DESKTOP_GRID_FILL_CLASS,
  DASHBOARD_DESKTOP_ROOT_CLASS,
  dashboardMapCenterSquareClass,
  dashboardMapRightShellClass,
  dashboardTripleSideShellClass,
  DASHBOARD_DESKTOP_GALAXY_BOTTOM_CLASS,
  DASHBOARD_DESKTOP_GALAXY_INSET_END_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import GlassPanel from "@/core/ui/GlassPanel";
import { GLASS_PANEL_BODY_SCROLL } from "@/core/ui/glassPanelChrome";
import type { Intervention } from "@/features/interventions/types";

function interventionHasMapCoordinates(iv: Intervention): boolean {
  const loc = iv.location;
  if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return false;
  return Number.isFinite(loc.lat) && Number.isFinite(loc.lng);
}

function isValidMissionCoordinates(coords: [number, number]): boolean {
  const [lng, lat] = coords;
  return Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);
}

export default function MapboxView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const isMobileClient = useIsMobile();
  const mobileHubLayout = useMobileHubLayout();
  const isMobile = mobileHubLayout || isMobileClient === true;
  const pager = useDashboardPagerOptional();
  const inboxIntent = useBackofficeInboxIntentOptional();
  const mapRenderActive = useMobileMapRenderGate(mapContainerRef);
  const powerGate = useMobileMapPagePowerGate(inboxIntent?.activeInboxTab);
  const mapHubDataActive = isMobile !== true || powerGate.mapHubDataActive;
  const dashboardPageIndex = pager?.pageIndex ?? 0;
  const mapWebGLActive = isMapWebGLActive(isMobile, dashboardPageIndex, mapRenderActive);
  const galaxyBridge = useGalaxyLayerBridgeOptional();
  const { t } = useTranslation();
  const mapPauseOptions = useMemo(() => resolveMapboxPauseOptions(), []);
  const androidMapWebView = mapPauseOptions.skipStop === true;
  const { archivedKeys, archiveKey } = useMapArchivedMissions();

  const { selectedDate } = useDateContext();
  const workspace = useCompanyWorkspaceOptional();

  // Carte dispatch (admin/collaborateur tenant) vs missions assignées au technicien terrain.
  const isDispatchMap = isCompanyDispatchViewer(workspace);
  const { interventions: boInterventions } = useBackOfficeInterventions(
    isDispatchMap && mapHubDataActive ? (workspace?.activeCompanyId ?? null) : null
  );
  const { interventions: techInterventions, firebaseUid: technicianUid } = useTechnicianAssignments(
    {
      enabled: !isDispatchMap && mapHubDataActive,
    }
  );

  const firestoreInterventions = isDispatchMap ? boInterventions : techInterventions;

  const [liveMissions, setLiveMissions] = useState<Mission[]>([]);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [mapBootError, setMapBootError] = useState<"token" | "load" | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [routeLine, setRouteLine] = useState<Array<[number, number]>>([]);
  const requestMobileHubRail = useRequestMobileHubRail();
  const selectedDateStr = useMemo(() => selectedDate.toLocaleDateString("en-CA"), [selectedDate]);

  const allMissions = useMemo(() => {
    const liveForDay = liveMissions.filter((m) => !m.date || m.date === selectedDateStr);

    const realMissions: Mission[] = firestoreInterventions
      .filter((iv) =>
        isDispatchMap
          ? isInterventionReleasedToTechnicianField(iv)
          : isInterventionVisibleOnTechnicianMap(iv)
      )
      .filter((iv) =>
        isDispatchMap
          ? interventionMatchesTab(iv, "today", selectedDate)
          : interventionVisibleInTechnicianMissionList(iv, "today", technicianUid, selectedDate)
      )
      .filter(interventionHasMapCoordinates)
      .map((iv) => {
        let numericId = 0;
        for (let i = 0; i < iv.id.length; i++) {
          numericId = (numericId << 5) - numericId + iv.id.charCodeAt(i);
          numericId |= 0;
        }
        return {
          id: Math.abs(numericId),
          key: iv.id,
          clientName: interventionClientLabel(iv) || String(t("common.client")),
          coordinates: [iv.location.lng, iv.location.lat],
          time: formatScheduledTimeOnly(iv),
          status: String(t(statusLabelKey(iv.status))),
          statusCode: iv.status,
          source: "live",
          date: iv.scheduledDate || selectedDateStr,
          phone: iv.clientPhone || iv.phone || undefined,
          address: iv.address || undefined,
          description: iv.problem || iv.transcription || undefined,
        };
      });

    const all = [...realMissions, ...liveForDay];

    // Deduplicate by key or id
    const unique = new Map<string | number, Mission>();
    all.forEach((m) => {
      const key = m.key ?? m.id;
      if (!unique.has(key)) unique.set(key, m);
    });
    const deduped = Array.from(unique.values());

    const score = (t: string) => {
      if (!t) return 9999;
      if (t === "Maintenant") return -1;
      const raw = t.trim();
      const last = raw.split(/\s+/).pop() || raw;
      const m = /^(\d{2}):(\d{2})$/.exec(last);
      if (!m) return 9999;
      return Number(m[1]) * 60 + Number(m[2]);
    };
    return [...deduped].sort((a, b) => score(a.time) - score(b.time));
  }, [
    liveMissions,
    firestoreInterventions,
    selectedDateStr,
    selectedDate,
    isDispatchMap,
    technicianUid,
    t,
  ]);

  const visibleMissions = useMemo(
    () => allMissions.filter((m) => !archivedKeys.has(missionStableKey(m))),
    [allMissions, archivedKeys]
  );

  const visibleInterventions = useMemo(() => {
    const keys = new Set(visibleMissions.map((m) => m.key).filter(Boolean));
    return firestoreInterventions.filter((iv) => keys.has(iv.id));
  }, [firestoreInterventions, visibleMissions]);

  const handleRouteOptimized = useCallback((ordered: Intervention[]) => {
    const coords: Array<[number, number]> = ordered
      .filter((iv) => iv.location?.lat && iv.location?.lng)
      .map((iv) => [iv.location.lng, iv.location.lat]);
    setRouteLine(coords);
  }, []);

  const kpiCounts = useMemo(
    () => ({
      pending: visibleMissions.filter((m) =>
        ["pending", "assigned", "pending_needs_address"].includes(m.statusCode ?? "")
      ).length,
      inProgress: visibleMissions.filter((m) =>
        ["en_route", "in_progress"].includes(m.statusCode ?? "")
      ).length,
      done: visibleMissions.filter((m) => ["done", "invoiced"].includes(m.statusCode ?? "")).length,
    }),
    [visibleMissions]
  );

  const handleArchiveMission = React.useCallback(
    (mission: Mission) => {
      archiveKey(missionStableKey(mission));
      setSelectedMission((prev) =>
        prev && missionStableKey(prev) === missionStableKey(mission) ? null : prev
      );
      toast.success(String(t("map.daily_missions.archived_toast")));
    },
    [archiveKey, t]
  );

  const handleDeleteMission = React.useCallback(
    async (mission: Mission) => {
      const ok = window.confirm(String(t("map.daily_missions.delete_confirm")));
      if (!ok) return;

      if (mission.key && firestore) {
        try {
          await deleteDoc(doc(firestore, "interventions", mission.key));
          toast.success(String(t("map.daily_missions.deleted_toast")));
          setSelectedMission(null);
        } catch {
          toast.error("Erreur de suppression");
        }
      } else {
        archiveKey(missionStableKey(mission));
        setSelectedMission(null);
        toast.success(String(t("map.daily_missions.deleted_toast")));
      }
    },
    [archiveKey, t]
  );

  useEffect(() => {
    if (!galaxyBridge) return;

    galaxyBridge.registerInterventionConsumer((m) => {
      setLiveMissions((prev) => [
        { ...m, source: "live", date: m.date || selectedDateStr },
        ...prev.filter((x) => (x.key ?? String(x.id)) !== m.key),
      ]);
    });

    return () => galaxyBridge.registerInterventionConsumer(null);
  }, [galaxyBridge, selectedDateStr]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !mapWebGLActive || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
    if (!token) {
      setMapBootError("token");
      return;
    }

    let cancelled = false;
    let sizeObserver: ResizeObserver | null = null;
    let onVisibilityChange: (() => void) | null = null;
    let waitObserver: ResizeObserver | null = null;

    const attachMap = () => {
      if (cancelled || mapRef.current || !mapWebGLActive) return;
      if (container.clientWidth < 2 || container.clientHeight < 2) return;

      mapboxgl.accessToken = token;
      configureMapboxWebView(mapboxgl);
      const initialCenter: [number, number] = [4.3522, 50.8466];
      const mobileMap = isMobile === true;
      const deviceTier = mobileMap ? resolveMapboxDeviceTier() : "high";
      const powerOptions = resolveMapboxInitOptions(mobileMap, deviceTier);
      const runtimeOptions = resolveMapboxMapRuntimeOptions(mobileMap, undefined, deviceTier);
      const style = resolveMapboxStyleUrl(resolveMapboxStyleSlug(mobileMap), token);

      markMapboxPerf("init-start");

      if (
        typeof mapboxgl.supported === "function" &&
        !mapboxgl.supported({
          failIfMajorPerformanceCaveat: runtimeOptions.failIfMajorPerformanceCaveat,
        })
      ) {
        if (!cancelled) setMapBootError("load");
        return;
      }

      const map = new mapboxgl.Map({
        container,
        style,
        center: initialCenter,
        zoom: 12.5,
        pitch: 0,
        bearing: 0,
        antialias: powerOptions.antialias,
        fadeDuration: powerOptions.fadeDuration,
        refreshExpiredTiles: powerOptions.refreshExpiredTiles,
        maxTileCacheSize: powerOptions.maxTileCacheSize,
        renderWorldCopies: powerOptions.renderWorldCopies,
        collectResourceTiming: powerOptions.collectResourceTiming,
        respectPrefersReducedMotion: powerOptions.respectPrefersReducedMotion,
        failIfMajorPerformanceCaveat: runtimeOptions.failIfMajorPerformanceCaveat,
        preserveDrawingBuffer: androidMapWebView,
        maxBounds: [
          [4.15, 50.7],
          [4.55, 50.95],
        ],
        minZoom: 11.8,
        attributionControl: false,
        localIdeographFontFamily: "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
      });

      mapRef.current = map;
      setMapBootError(null);
      markMapboxPerf("init-end");

      if (mobileMap) {
        map.getContainer().dataset.mapboxDeviceTier = deviceTier;
      }

      if (isMobile) {
        map.dragPan.disable();
        map.touchZoomRotate.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
        map.keyboard.disable();
      }

      map.on("load", () => {
        if (cancelled) return;
        markMapboxPerf("load");
        const perf = measureMapboxPerf(deviceTier);
        logger.info("[mapbox-perf]", perf);
        setMapReady(true);
        scheduleMapboxResizeBurst(map);
      });

      map.on("style.load", () => {
        applyMapboxPremiumBasemapConfig(map);
      });

      map.on("error", (ev) => {
        const detail =
          ev && typeof ev === "object" && "error" in ev
            ? (ev as { error?: { message?: string } }).error?.message
            : undefined;
        logger.error("[mapbox]", {
          error: detail ?? (ev instanceof Error ? ev.message : String(ev)),
        });
        if (!cancelled) setMapBootError("load");
      });

      map.on("moveend", () => {
        const currentState = {
          center: map.getCenter().toArray(),
          zoom: map.getZoom(),
          pitch: 0,
          bearing: 0,
        };
        localStorage.setItem("mapboxViewState", JSON.stringify(currentState));
      });

      sizeObserver = new ResizeObserver(() => {
        if (document.hidden) return;
        window.requestAnimationFrame(() => {
          try {
            map.resize();
          } catch {
            /* ignore */
          }
        });
      });
      sizeObserver.observe(container);

      onVisibilityChange = () => {
        if (document.hidden) {
          pauseMapboxMap(map, mapPauseOptions);
          return;
        }
        resumeMapboxMap(map);
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
    };

    attachMap();
    if (!mapRef.current) {
      waitObserver = new ResizeObserver(() => attachMap());
      waitObserver.observe(container);
    }

    return () => {
      cancelled = true;
      waitObserver?.disconnect();
      sizeObserver?.disconnect();
      if (onVisibilityChange) {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [isMobile, mapWebGLActive, androidMapWebView, mapPauseOptions]);

  useEffect(() => {
    if (!isCapacitorNative()) return;

    let cancelled = false;
    let removeListener: (() => void) | undefined;

    void (async () => {
      const { App } = await import("@capacitor/app");
      if (cancelled) return;
      const handle = await App.addListener("resume", () => {
        const map = mapRef.current;
        if (!map) return;
        scheduleMapboxResizeBurst(map);
        resumeMapboxMap(map);
      });
      removeListener = () => void handle.remove();
    })();

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, []);

  /** Mobile : pause WebGL (tuiles en cache). Desktop : détruit si hub masqué. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!mapWebGLActive) {
      if (resolveMapboxLifecycleMode(isMobile) === "pause") {
        pauseMapboxMap(map, mapPauseOptions);
      } else {
        destroyMapboxMap(map);
        mapRef.current = null;
        setMapReady(false);
      }
      return;
    }

    if (isMobile) {
      resumeMapboxMap(map);
    }
  }, [isMobile, mapWebGLActive, mapPauseOptions]);

  useEffect(() => {
    return () => {
      const map = mapRef.current;
      if (!map) return;
      destroyMapboxMap(map);
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const bounds = new mapboxgl.LngLatBounds();

    visibleMissions.forEach((mission, index) => {
      const coords = mission.coordinates as [number, number];
      if (!isValidMissionCoordinates(coords)) return;
      bounds.extend(coords);

      const isLive = mission.source === "live";
      const tone = mission.statusCode
        ? dailyMissionCardToneFromStatus(mission.statusCode)
        : "upcoming";
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
      glow.className = `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full ${markerGlowBlurClass(isMobile === true)} transition-all duration-500`;
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
        setSelectedMission(mission);
        map.flyTo({
          center: mission.coordinates as [number, number],
          zoom: 17,
          pitch: 0,
          duration: resolveMapCameraDuration(isMobile === true, "marker"),
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(mission.coordinates as [number, number])
        .addTo(map);

      const markerKey = mission.key ?? String(mission.id);
      markersRef.current[markerKey] = marker;
    });
  }, [visibleMissions, mapReady, isDispatchMap, isMobile]);

  const handleMobileMapResize = React.useCallback((rail: MobileHubRail) => {
    if (rail !== "center") return;
    const map = mapRef.current;
    if (!map) return;
    scheduleMapboxResizeBurst(map);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const SOURCE = "route-optimize-line";
    const LAYER = "route-optimize-layer";
    const geoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: routeLine },
    };
    if (map.getSource(SOURCE)) {
      (map.getSource(SOURCE) as mapboxgl.GeoJSONSource).setData(geoJSON);
    } else if (routeLine.length >= 2) {
      map.addSource(SOURCE, { type: "geojson", data: geoJSON });
      map.addLayer({
        id: LAYER,
        type: "line",
        source: SOURCE,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#3b82f6",
          "line-width": 3,
          "line-opacity": 0.75,
          "line-dasharray": [2, 2],
        },
      });
    }
  }, [routeLine, mapReady]);

  const userLocation = useNativeUserLocation(mapReady && mapRenderActive && mapWebGLActive, {
    lowAccuracy: isMobile === true,
  });

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const lngLat: [number, number] = [userLocation.longitude, userLocation.latitude];

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.setAttribute("data-testid", "map-user-puck");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.background = "#2563eb";
      el.style.border = "3px solid rgba(255,255,255,0.95)";
      el.style.boxShadow = "0 0 0 4px rgba(37,99,235,0.18), 0 2px 6px rgba(0,0,0,0.25)";
      el.style.pointerEvents = "none";
      userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(lngLat)
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat(lngLat);
    }
  }, [userLocation, mapReady, mapHubDataActive]);

  useEffect(() => {
    return () => {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isMobile || !mapReady) return;
    const map = mapRef.current;
    if (!map) return;
    const coords = visibleMissions
      .filter((m) => m.coordinates && isValidMissionCoordinates(m.coordinates as [number, number]))
      .map((m) => m.coordinates as [number, number]);
    if (coords.length === 0) return;
    if (coords.length === 1) {
      map.flyTo({
        center: coords[0],
        zoom: 15,
        duration: resolveMapCameraDuration(true, "marker"),
      });
      return;
    }
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const bounds: mapboxgl.LngLatBoundsLike = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.fitBounds(bounds, {
      padding: 60,
      maxZoom: 15,
      duration: resolveMapCameraDuration(true, "bounds"),
    });
  }, [visibleMissions, isMobile, mapReady]);

  useEffect(() => {
    if (dashboardPageIndex !== 0) return;
    const map = mapRef.current;
    if (!map) return;
    const resize = () => {
      try {
        map.resize();
      } catch {
        /* ignore */
      }
    };
    resize();
    const id = window.setTimeout(resize, 520);
    return () => clearTimeout(id);
  }, [dashboardPageIndex, mapReady]);

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    if (isMobile) requestMobileHubRail("center");
    if (inboxIntent) {
      inboxIntent.setPendingChatInterventionId(missionStableKey(mission));
    }
    if (mapRef.current && mission.coordinates) {
      mapRef.current.flyTo({
        center: mission.coordinates,
        zoom: 17,
        pitch: 0,
        duration: resolveMapCameraDuration(isMobile === true, "marker"),
      });
    }
  };

  const handleRecenter = () => {
    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [4.3522, 50.8466],
      zoom: 12.5,
      pitch: 0,
      bearing: 0,
      duration: resolveMapCameraDuration(isMobile === true, "recenter"),
      essential: true,
    });
  };

  const mapPanelInner = (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Carte"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none" as React.CSSProperties["WebkitUserSelect"],
        background: "#f8fafc",
      }}
    >
      <div ref={mapContainerRef} id="map" className="absolute inset-0 h-full w-full" />
      {mapBootError ? (
        <div
          data-testid="map-boot-error"
          className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-slate-50/95 px-6 text-center"
        >
          <p className="text-[14px] font-medium text-slate-800">
            {mapBootError === "token" ? t("map.boot_error_token") : t("map.boot_error_load")}
          </p>
          {mapBootError === "token" ? (
            <p className="max-w-sm text-[12px] text-slate-500">{t("map.boot_error_token_hint")}</p>
          ) : null}
        </div>
      ) : null}
      <div
        className="absolute z-[1] flex flex-col gap-2"
        style={{ bottom: "calc(env(safe-area-inset-bottom,0px) + 16px)", right: "16px" }}
      >
        <button
          onClick={handleRecenter}
          className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-[12px] border border-white/75 bg-white/95 opacity-90 shadow-md backdrop-blur-xl transition-all duration-300 hover:opacity-100"
          title="Recentrer la carte"
          type="button"
        >
          <svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        {visibleInterventions.length >= 2 ? (
          <TourOptimizeButton
            missions={visibleInterventions}
            onOptimized={handleRouteOptimized}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/75 bg-white/95 opacity-90 shadow-md backdrop-blur-xl transition-all duration-300 hover:opacity-100"
          />
        ) : null}
      </div>
      <AnimatePresence>
        {selectedMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex min-h-0 items-start justify-center overflow-y-auto overscroll-y-contain bg-gradient-to-b from-transparent to-black/60 p-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative mx-auto mb-6 mt-1 w-full max-w-lg shrink-0 rounded-2xl border border-white/10 bg-black/25 px-4 py-6 shadow-lg backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setSelectedMission(null)}
                className="absolute right-1 top-1 z-50 rounded-full p-2 text-white hover:bg-white/10"
                aria-label={String(t("common.close"))}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#ffffff"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="w-full pt-1 pr-10 text-center text-white">
                <h2 className="break-words text-2xl font-bold text-white">
                  {selectedMission.clientName}
                </h2>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-base text-white/90">
                  <span className="px-3 py-1 font-semibold rounded-full bg-white/20">
                    {selectedMission.status}
                  </span>
                  <span className="font-medium">{selectedMission.time}</span>
                </div>
                {selectedMission.phone && (
                  <a
                    href={`tel:${selectedMission.phone}`}
                    className="mt-4 block text-lg font-medium text-blue-300"
                  >
                    {selectedMission.phone}
                  </a>
                )}
                {selectedMission.address && (
                  <p className="mt-2 text-base text-white/80">{selectedMission.address}</p>
                )}
                <div className="mt-5 flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleArchiveMission(selectedMission)}
                    aria-label={String(t("map.daily_missions.archive_aria"))}
                    className="rounded-full border border-white/20 bg-white/10 p-2.5 text-white/60 hover:text-white"
                  >
                    <Archive className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMission(selectedMission)}
                    aria-label={String(t("map.daily_missions.delete_aria"))}
                    className="rounded-full border border-red-500/30 bg-red-500/10 p-2.5 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (mobileHubLayout) {
    return (
      <MobileHubLayout
        rootTestId="mobile-map-triple"
        leftLabel={String(t("map.mobile.rail_missions"))}
        centerLabel={String(t("map.mobile.rail_map"))}
        rightLabel={String(t("map.mobile.rail_inbox"))}
        panelPadding={false}
        sideScroll={false}
        onRailChange={handleMobileMapResize}
        left={
          <DailyMissions
            missions={visibleMissions}
            onMissionClick={handleMissionClick}
            isEmbedded
          />
        }
        center={
          <div id="map-container" className="flex h-full min-h-0 flex-col">
            {mapPanelInner}
          </div>
        }
        right={<BackOfficeInboxPanel dayMissions={visibleMissions} />}
      />
    );
  }

  const mapCenter = (
    <section
      className="relative h-full w-full shrink-0 snap-center overflow-hidden"
      id="map-container"
      aria-label="Carte"
    >
      {mapPanelInner}
    </section>
  );

  return (
    <div className={DASHBOARD_DESKTOP_ROOT_CLASS}>
      <div className={`${DASHBOARD_DESKTOP_GRID_CLASS} ${DASHBOARD_DESKTOP_GRID_FILL_CLASS}`}>
        <GlassPanel
          as="aside"
          id="dashboard-left-rail"
          className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--left`}
          shellClassName={dashboardTripleSideShellClass}
          innerClassName={`${GLASS_PANEL_BODY_SCROLL} !overflow-y-auto flex min-h-0 flex-col`}
        >
          <DailyMissions
            missions={visibleMissions}
            onMissionClick={handleMissionClick}
            isEmbedded
          />
        </GlassPanel>

        <GlassPanel
          as="main"
          id="map-container"
          className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center`}
          shellClassName={dashboardMapCenterSquareClass}
          innerClassName="relative min-h-0 flex-1 p-0"
        >
          <div
            className="relative flex min-h-0 flex-1 flex-col"
            style={{ userSelect: "none", WebkitUserSelect: "none", background: "#f8fafc" }}
          >
            <div
              ref={mapContainerRef}
              id="map"
              className="absolute inset-0 h-full w-full min-h-[240px]"
            />
            {mapBootError ? (
              <div
                data-testid="map-boot-error"
                className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2 bg-slate-50/95 px-6 text-center"
              >
                <p className="text-[14px] font-medium text-slate-800">
                  {mapBootError === "token" ? t("map.boot_error_token") : t("map.boot_error_load")}
                </p>
                {mapBootError === "token" ? (
                  <p className="max-w-sm text-[12px] text-slate-500">
                    {t("map.boot_error_token_hint")}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Premium Recenter Button */}
            <button
              onClick={handleRecenter}
              className={`group absolute z-[1] flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[14px] border border-white/75 bg-white/95 opacity-80 hover:opacity-100 shadow-[0_8px_30px_rgba(0,0,0,0.076),0_2px_10px_rgba(0,0,0,0.038)] backdrop-blur-2xl backdrop-saturate-[180%] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.11)] active:translate-y-0 active:scale-95 ${DASHBOARD_DESKTOP_GALAXY_BOTTOM_CLASS} ${DASHBOARD_DESKTOP_GALAXY_INSET_END_CLASS}`}
              title="Recentrer la carte"
            >
              <svg
                className="h-5 w-5 text-slate-600 transition-colors group-hover:text-slate-900"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>

            {/* Overlay Description Mission */}
            <AnimatePresence>
              {selectedMission && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 flex min-h-0 items-start justify-center overflow-y-auto overscroll-y-contain bg-gradient-to-b from-transparent to-black/60 p-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-auto sm:p-5 sm:pb-10"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative mx-auto mb-6 mt-1 w-full max-w-2xl shrink-0 rounded-2xl border border-white/10 bg-black/25 px-4 py-6 shadow-lg backdrop-blur-md sm:mb-10 sm:mt-2 sm:px-8 sm:py-8"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMission(null)}
                      className="absolute right-1 top-1 z-50 rounded-full p-2 !text-white hover:bg-white/10 hover:opacity-90 sm:right-2 sm:top-2"
                      aria-label={String(t("common.close"))}
                    >
                      <svg
                        className="h-6 w-6 sm:h-8 sm:w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="#ffffff"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>

                    <div className="w-full pt-1 pr-10 text-center text-white sm:pr-12 sm:pt-2">
                      <h2 className="break-words text-2xl font-bold leading-snug tracking-tight text-white sm:text-4xl md:text-5xl">
                        {selectedMission.clientName}
                      </h2>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-base text-white/90 sm:mt-5 sm:gap-4 sm:text-lg">
                        <span className="px-3 py-1 font-semibold rounded-full bg-white/20 sm:px-4 sm:py-1.5">
                          {selectedMission.status}
                        </span>
                        <span className="hidden text-white/40 sm:inline">•</span>
                        <span className="font-medium">{selectedMission.time}</span>
                      </div>

                      <div className="mt-6 flex w-full max-w-lg flex-col gap-5 text-left sm:mt-8 sm:gap-7 mx-auto">
                        {selectedMission.phone && (
                          <div className="flex min-w-0 flex-col">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1 sm:text-sm">
                              {t("map.mission_overlay.phone")}
                            </span>
                            <a
                              href={`tel:${selectedMission.phone}`}
                              className="break-all text-lg font-medium text-white hover:text-blue-400 transition-colors sm:text-2xl"
                            >
                              {selectedMission.phone}
                            </a>
                          </div>
                        )}
                        {selectedMission.address && (
                          <div className="flex min-w-0 flex-col">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1 sm:text-sm">
                              {t("map.mission_overlay.address")}
                            </span>
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(selectedMission.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-medium text-white hover:text-blue-400 transition-colors sm:text-2xl flex flex-wrap items-start gap-2"
                            >
                              <span className="min-w-0 break-words">{selectedMission.address}</span>
                              <svg
                                className="mt-0.5 h-4 w-4 shrink-0 text-white/50 sm:h-5 sm:w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                        )}
                        {selectedMission.description && (
                          <div className="flex min-w-0 flex-col">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 sm:text-sm sm:mb-2">
                              {t("map.mission_overlay.problem_description")}
                            </span>
                            <p className="break-words text-base !text-white font-medium leading-relaxed rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm sm:p-5 sm:text-lg">
                              {selectedMission.description}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 flex justify-center gap-4 sm:mt-8">
                        <button
                          type="button"
                          onClick={() => handleArchiveMission(selectedMission)}
                          aria-label={String(t("map.daily_missions.archive_aria"))}
                          title={String(t("map.daily_missions.archive_aria"))}
                          className="rounded-full border border-white/20 bg-white/[0.06] p-2.5 text-white/50 shadow-sm transition hover:border-white/35 hover:bg-white/10 hover:text-white/85"
                        >
                          <Archive className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMission(selectedMission)}
                          aria-label={String(t("map.daily_missions.delete_aria"))}
                          title={String(t("map.daily_missions.delete_aria"))}
                          className="rounded-full border border-red-500/30 bg-red-500/10 p-2.5 text-red-400/70 shadow-sm transition hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassPanel>

        <GlassPanel
          as="aside"
          className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--right`}
          shellClassName={dashboardMapRightShellClass}
          innerClassName="flex min-h-0 flex-1 flex-col"
        >
          <div className={cn("flex min-h-0 flex-1 flex-col", dashboardPageIndex !== 0 && "hidden")}>
            <BackOfficeInboxPanel dayMissions={visibleMissions} />
          </div>
          <div className={cn("flex min-h-0 flex-1 flex-col", dashboardPageIndex === 0 && "hidden")}>
            <RequesterTrackingPanel />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
