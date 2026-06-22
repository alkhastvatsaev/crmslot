"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";

const SOURCE = "route-optimize-line";
const LAYER = "route-optimize-layer";

export function useMapRouteLineLayer(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  mapReady: boolean,
  mapWebGLActive: boolean,
  routeLine: Array<[number, number]>
) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !mapWebGLActive) return;

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
  }, [mapReady, mapRef, mapWebGLActive, routeLine]);
}
