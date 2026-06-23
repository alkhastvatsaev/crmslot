"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AiAssistant, {
  type AiPlaybackSync,
  type QueuedClip,
} from "@/features/dispatch/components/AiAssistant";
import MapTranscriptionOverlay from "@/features/map/components/MapTranscriptionOverlay";
import MapTranscriptionActionsPanel from "@/features/map/components/MapTranscriptionActionsPanel";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { DASHBOARD_DESKTOP_GALAXY_RAIL_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";

const OVERLAY_ROOT_ID = "dashboard-overlay-root";

type Props = {
  transcriptionArmed: boolean;
  onUserPressPlay: () => void;
  onInterventionCreated?: (mission: {
    id: number;
    key: string;
    clientName: string;
    coordinates: [number, number];
    time: string;
    status: string;
    source?: "live";
    date?: string;
  }) => void;
  /** true = overlays + file audio seulement (dock Galaxy = Chatbot). */
  hideDockStrip?: boolean;
  /** Polling Firestore / disque MacroDroid (désactivé hors page carte mobile). */
  backgroundTasksEnabled?: boolean;
  mobilePowerSave?: boolean;
};

/**
 * Isole l’état `playbackSync` (~60 Hz) pour ne pas re-rendre MapboxView / la carte à chaque frame.
 */
export default function MapGalaxyTranscriptionLayer({
  transcriptionArmed,
  onUserPressPlay,
  onInterventionCreated,
  hideDockStrip = false,
  backgroundTasksEnabled = true,
  mobilePowerSave,
}: Props) {
  const isMobile = useIsMobile();
  const pager = useDashboardPagerOptional();
  const pageIndex = pager?.pageIndex ?? 0;
  const bridge = useGalaxyLayerBridgeOptional();
  const [playbackSync, setPlaybackSync] = useState<AiPlaybackSync>(null);
  const [openEditSignal, setOpenEditSignal] = useState(0);
  const [transcriptOverlayOpen, setTranscriptOverlayOpen] = useState(false);
  const [historyModeOpen, setHistoryModeOpen] = useState(false);
  const [queue, setQueue] = useState<QueuedClip[]>([]);
  /** N’est passé à `true` qu’après un appui sur lecture Galaxy — l’auto-play ne montre pas le texte. */
  const [transcriptTextEnabled, setTranscriptTextEnabled] = useState(false);
  /** Clip en cours dans la file AiAssistant — pour ne pas afficher le « dernier » fichier disque par erreur. */
  const [activeClipPublicUrl, setActiveClipPublicUrl] = useState<string | null>(null);
  const [overlayRoot, setOverlayRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!transcriptionArmed) setActiveClipPublicUrl(null);
  }, [transcriptionArmed]);

  useEffect(() => {
    const readRoot = () => document.getElementById(OVERLAY_ROOT_ID);
    const existing = readRoot();
    if (existing) {
      setOverlayRoot(existing);
      return;
    }
    const id = window.requestAnimationFrame(() => {
      setOverlayRoot(readRoot());
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  /**
   * AiAssistant envoie `null` quand la file est vide (ex. fin du dernier clip) : ne pas effacer,
   * sinon transcription + formulaire disparaissent alors que l’utilisateur n’a pas quitté la session.
   */
  const onActiveClipFromAssistant = useCallback((url: string | null) => {
    const t = url?.trim() ?? "";
    if (!t) return;
    setActiveClipPublicUrl(t);
  }, []);

  const onTranscriptVisible = useCallback((visible: boolean) => {
    setTranscriptOverlayOpen(visible);
    if (!visible) {
      setTranscriptTextEnabled(false);
      setHistoryModeOpen(false);
    }
  }, []);

  const openVoiceReview = useCallback(() => {
    onUserPressPlay();
    setTranscriptTextEnabled(true);
    setOpenEditSignal((v) => v + 1);
  }, [onUserPressPlay]);

  const onNewFirestoreClip = useCallback(() => {
    if (isMobile !== true || pageIndex !== 0) return;
    openVoiceReview();
  }, [isMobile, pageIndex, openVoiceReview]);

  const onVoiceReviewComplete = useCallback(() => {
    bridge?.disarmTranscription();
  }, [bridge]);

  const overlays = (
    <>
      <MapTranscriptionOverlay
        armed={transcriptionArmed}
        playOpenSignal={openEditSignal}
        transcriptTextEnabled={transcriptTextEnabled && !historyModeOpen}
        playbackSync={playbackSync}
        onVisibleChange={onTranscriptVisible}
        scopedClipPublicUrl={activeClipPublicUrl}
        forceVisible={historyModeOpen}
        onVoiceReviewComplete={onVoiceReviewComplete}
      />
      <MapTranscriptionActionsPanel
        armed={transcriptionArmed}
        onInterventionCreated={onInterventionCreated}
        openEditSignal={openEditSignal}
        scopedClipPublicUrl={activeClipPublicUrl}
        onVoiceReviewComplete={onVoiceReviewComplete}
      />
      {historyModeOpen ? (
        <HistoryPanel queue={queue} onClose={() => setHistoryModeOpen(false)} />
      ) : null}
    </>
  );

  return (
    <>
      {overlayRoot ? createPortal(overlays, overlayRoot) : null}
      <AiAssistant
        headless={hideDockStrip}
        dockLayout={!hideDockStrip}
        transcriptOverlayVisible={transcriptOverlayOpen}
        onActiveClipUrlChange={onActiveClipFromAssistant}
        onUserPressPlay={openVoiceReview}
        onPlaybackSync={setPlaybackSync}
        onUserLongPress={() => setHistoryModeOpen(true)}
        onQueueChange={setQueue}
        onNewFirestoreClip={onNewFirestoreClip}
        backgroundTasksEnabled={backgroundTasksEnabled}
        mobilePowerSave={mobilePowerSave}
      />
    </>
  );
}

function HistoryPanel({ queue, onClose: _onClose }: { queue: QueuedClip[]; onClose: () => void }) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTranscript(null);
      return;
    }
    let active = true;
    setLoading(true);
    void fetchWithAuth(`/api/ai/latest-audio?url=${encodeURIComponent(selectedUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setTranscript(data.audio?.transcript || "Aucune transcription disponible.");
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setTranscript("Erreur de chargement de la transcription.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedUrl]);

  return (
    <div
      data-testid="map-history-overlay"
      className={`${DASHBOARD_DESKTOP_GALAXY_RAIL_CLASS} z-[140]`}
    >
      <div
        className="max-w-[min(92vw,820px)] w-full flex flex-col items-center gap-4 text-center text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.75)]"
        style={{ contain: "layout style" }}
      >
        {selectedUrl ? (
          <>
            <button
              onClick={() => setSelectedUrl(null)}
              className="pointer-events-auto text-sm font-bold text-white/70 hover:text-white transition-colors mb-2"
            >
              ← Retour aux audios
            </button>
            {loading ? (
              <div className="text-lg font-semibold text-white/90">Transcription…</div>
            ) : (
              <div className="pointer-events-auto whitespace-pre-wrap text-2xl font-extrabold leading-snug tracking-tight text-white max-h-[60vh] overflow-y-auto hide-scrollbar">
                {transcript}
              </div>
            )}
          </>
        ) : queue.length === 0 ? (
          <div className="text-lg font-semibold text-white/90">Aucun historique disponible.</div>
        ) : (
          <div className="pointer-events-auto flex flex-wrap justify-center gap-3 max-h-[60vh] overflow-y-auto p-4 hide-scrollbar">
            {queue
              .slice()
              .reverse()
              .map((clip, i) => {
                const d = new Date(clip.createdAt);
                return (
                  <button
                    key={clip.url + i}
                    onClick={() => setSelectedUrl(clip.url)}
                    className="px-5 py-2.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors border border-white/10 shadow-lg backdrop-blur-md flex items-center gap-2"
                  >
                    <span className="font-bold text-lg text-white/90">Audio</span>
                    <span className="font-medium text-sm text-white/60">
                      {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
