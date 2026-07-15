import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getSettings } from "../lib/settings";
import { initShakemap } from "../lib/shakemap";
import { initStations } from "./stations";
import { assetUrl } from "../lib/assetUrl";
import type { AppSettings } from "../lib/settingsSchema";

export const getHomeLat = (): number => getSettings().lat;
export const getHomeLon = (): number => getSettings().lon;

const isSatelliteStyle = (mapType: AppSettings["mapType"]): boolean => mapType !== "default_no_sattelite";

const buildStyle = (satellite: boolean): maplibregl.StyleSpecification => ({
  version: 8,
  sources: satellite ? {
    satellite: {
      type: "raster",
      tiles: [
        "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
      ],
      tileSize: 256,
    },
  } : {},
  layers: satellite ? [{
    id: "satellite",
    type: "raster",
    source: "satellite",
  }] : [],
});

let map: maplibregl.Map | null = null;
let ready = false;
const readyCallbacks: Array<() => void> = [];

export const getMap = (): maplibregl.Map => {
  if (!map) throw new Error("Map has not been created yet");
  return map;
};

export const isMapReady = (): boolean => ready;

export const onMapReady = (cb: () => void): void => {
  if (ready) cb();
  else readyCallbacks.push(cb);
};

const markers = new Map<string, maplibregl.Marker>();

const worldGeojson = assetUrl("geojson/world.geojson");
const shindoGeojson = assetUrl("geojson/shindo.geojson");
const mmiGeojson = assetUrl("geojson/mmi.geojson");
const cwasisGeojson = assetUrl("geojson/cwasis.geojson");
const csisGeojson = assetUrl("geojson/csis.geojson");
const geonetMmiGeojson = assetUrl("geojson/geonet_mmi.geojson");

interface BorderStyle {
  color: string;
  width: number;
  opacity: number;
}

const defaultBorderStyle: BorderStyle = { color: "#707173", width: 0.65, opacity: 0.5 };

export const addGeojson = (geojson: string, country: string, borderStyle: BorderStyle = defaultBorderStyle): void => {
  const m = getMap();
  m.addSource(country, {
    type: "geojson",
    data: geojson,
  });

  m.addLayer({
    id: `${country}-fills`,
    type: "fill",
    source: country,
    paint: {
      "fill-color": "#3f4045",
      "fill-opacity": 1,
    },
  });

  m.addLayer({
    id: `${country}-borders`,
    type: "line",
    source: country,
    paint: {
      "line-color": borderStyle.color,
      "line-width": borderStyle.width,
      "line-opacity": borderStyle.opacity,
    },
  });
};

export const flyZoom = (lon: number, lat: number, zoom: number, duration: number): void => {
  getMap().flyTo({
    center: [lon, lat],
    zoom,
    essential: true,
    duration: duration * 1000,
  });
};

export const flyToBounds = (bounds: [[number, number], [number, number]], duration: number, maxZoom = 8.5): void => {
  getMap().fitBounds(bounds, {
    padding: 40,
    essential: true,
    duration: duration * 1000,
    maxZoom,
  });
};

export const placeMarker = (lon: number, lat: number, width: string, height: string, id: string, icon: string): void => {
  const el = document.createElement("div");
  const img = document.createElement("img");
  img.src = icon;
  img.style.width = width;
  img.style.height = height;
  el.appendChild(img);
  const marker = new maplibregl.Marker({ element: el })
    .setLngLat([lon, lat])
    .addTo(getMap());
  markers.set(id, marker);
};

export const deleteMarker = (id: string): void => {
  const marker = markers.get(id);
  marker?.remove();
  markers.delete(id);
};

const setupMapLayers = (): void => {
  const m = getMap();

  m.addSource("waves", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });

  m.addLayer({
    id: "S-wave-fill",
    type: "fill",
    source: "waves",
    filter: ["==", ["get", "type"], "S"],
    paint: {
      "fill-color": "#ff2828",
      "fill-opacity": 0.3,
    },
  });

  addGeojson(worldGeojson, "world", { color: "#707173", width: 0.9, opacity: 1 });
  addGeojson(shindoGeojson, "shindo");
  addGeojson(mmiGeojson, "mmi");
  addGeojson(cwasisGeojson, "cwasis");
  addGeojson(csisGeojson, "csis");
  addGeojson(geonetMmiGeojson, "geonetMmi");

  initShakemap();

  ["world", "shindo", "mmi", "cwasis", "csis", "geonetMmi"].forEach(country => {
    m.moveLayer(`${country}-borders`);
  });

  m.addLayer({
    id: "S-wave-glow-outer",
    type: "line",
    source: "waves",
    filter: ["==", ["get", "type"], "S"],
    paint: {
      "line-color": "#ff2828",
      "line-width": 22,
      "line-blur": 14,
      "line-opacity": 0.2,
    },
  });

  m.addLayer({
    id: "S-wave-glow-mid",
    type: "line",
    source: "waves",
    filter: ["==", ["get", "type"], "S"],
    paint: {
      "line-color": "#ff2828",
      "line-width": 9,
      "line-blur": 6,
      "line-opacity": 0.4,
    },
  });

  m.addLayer({
    id: "S-wave-border",
    type: "line",
    source: "waves",
    filter: ["==", ["get", "type"], "S"],
    paint: {
      "line-color": "#ff5656ff",
      "line-width": 2.5,
    },
  });

  m.addLayer({
    id: "P-wave-border",
    type: "line",
    source: "waves",
    filter: ["==", ["get", "type"], "P"],
    paint: {
      "line-color": "#82b4ff",
      "line-width": 1.75,
    },
  });

  initStations();
};

export const createMap = (container: HTMLElement): maplibregl.Map => {
  if (map) return map;

  const initial = getSettings();

  map = new maplibregl.Map({
    container,
    style: buildStyle(isSatelliteStyle(initial.mapType)),
    center: [initial.lon, initial.lat],
    zoom: 5,
    maxZoom: 12,
    minZoom: 3,
    attributionControl: false
  });

  map.on("error", (e) => console.error("MapLibre error:", e?.error ?? e));

  map.on("load", () => {
    try {
      setupMapLayers();
      placeMarker(initial.lon, initial.lat, "1.75vw", "1.75vh", "location", assetUrl("images/location.svg"));

      ready = true;
      readyCallbacks.splice(0).forEach(cb => cb());
    } catch (err) {
      console.error("Map load handler failed:", err);
    }
  });

  return map;
};

export const destroyMap = (): void => {
  map?.remove();
  map = null;
  ready = false;
  markers.clear();
};
