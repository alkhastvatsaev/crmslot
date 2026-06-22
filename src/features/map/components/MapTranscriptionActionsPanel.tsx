"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import MapTranscriptionEditPanel from "@/features/map/components/MapTranscriptionEditPanel";
import {
  useMapTranscriptionActionsController,
  type MapTranscriptionActionsControllerOptions,
} from "@/features/map/hooks/useMapTranscriptionActionsController";

export default function MapTranscriptionActionsPanel(
  props: MapTranscriptionActionsControllerOptions
) {
  const { canShow, editOpen, railScreenRect, form, setForm, busy, isValid, supprimer, create } =
    useMapTranscriptionActionsController(props);

  return (
    <>
      <AnimatePresence initial={false}>
        {canShow && editOpen ? (
          <MapTranscriptionEditPanel
            railScreenRect={railScreenRect}
            form={form}
            setForm={setForm}
            busy={busy}
            isValid={isValid}
            onSupprimer={supprimer}
            onCreate={create}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
