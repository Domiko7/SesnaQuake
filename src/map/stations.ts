import { getColorPga, getColorPgv, getCwaShindoIntensity } from "../lib/transform";
import { getSettings } from "../lib/settings";
import { getMap } from "./mapInstance";
import type { Feature, FeatureCollection, Point, GeoJsonProperties } from "geojson";
import type { StnPacket } from "../lib/wsTypes";

const stnColor = (pga: number, pgv: number): string =>
  getSettings().stnColor === "pga" ? getColorPga(pga) : getColorPgv(pgv);

const stnIntensity = (author: string, pga: number, pgv: number): number => {
  if (getSettings().stnIntensityIcons) {
    if (author?.toLocaleLowerCase() == "sinica" || author?.toLocaleLowerCase() == "exptech") return getCwaShindoIntensity(pga, pgv);
    if (author?.toLocaleLowerCase() == "eews") return getCwaShindoIntensity(pga, pgv);
  }
  return 0;
};

const loadIntensityIcons = () => {
  const map = getMap();
  for (let i = 0; i <= 9; i++) {
    const img = new Image(88, 88);
    img.onload = () => {
      if (!map.hasImage(`stn-int-${i}`)) map.addImage(`stn-int-${i}`, img);
    };
    img.src = `images/s${i}.svg`;
  }
};

const loadedStns = new Set<string>();

const stnsGeojson: FeatureCollection<Point, GeoJsonProperties> = {
  type: "FeatureCollection",
  features: [] as Feature<Point, GeoJsonProperties>[],
};

export const updateStations = (stns: StnPacket) => {
  for (const stn of stns.data) {
    if (!loadedStns.has(stn.code)) {
      const lon = parseFloat(stn.lon as unknown as string);
      const lat = parseFloat(stn.lat as unknown as string);

      if (isNaN(lon) || isNaN(lat)) {
        console.error("Invalid station coordinates received:", stn);
        continue;
      }
      const stnFeature = {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [stn.lon, stn.lat] },
        properties: {
          id: stn.code,
          net: stn.author,
          name: stn.name,
          color: stnColor(stn.pga, stn.pgv),
          intensity: stn.intensity ?? stnIntensity(stn.author, stn.pga, stn.pgv),
          opacity: 1,
        },
      };

      stnsGeojson.features.push(stnFeature);
      loadedStns.add(stn.code);
    } else {
      const stnFeature = stnsGeojson.features.find(
        f => f.properties?.id === stn.code
      );

      if (stnFeature && stnFeature.properties) {
        stnFeature.properties.color = stnColor(stn.pga, stn.pgv);
        stnFeature.properties.intensity = stn.intensity ?? stnIntensity(stn.author, stn.pga, stn.pgv);
      }
    }
  }
  const source = getMap().getSource("stations") as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(stnsGeojson);
  }
};

export const setStationsVisible = (visible: boolean) => {
  const map = getMap();
  const visibility = visible ? "visible" : "none";
  if (map.getLayer("stn-layer")) map.setLayoutProperty("stn-layer", "visibility", visibility);
  if (map.getLayer("stn-intensity-layer")) map.setLayoutProperty("stn-intensity-layer", "visibility", visibility);
};

export const updateConfirmedStations = (stations: { lat: number; lon: number; intensity: number }[]) => {
  const source = getMap().getSource("confirmed-stations") as maplibregl.GeoJSONSource | undefined;
  if (!source) return;
  source.setData({
    type: "FeatureCollection",
    features: stations.map(({ lat, lon, intensity }) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [lon, lat] },
      properties: { intensity },
    })),
  });
};

export const initStations = () => {
  const map = getMap();
  const scale = getSettings().stnSize / 100;

  loadIntensityIcons();
  map.addSource("stations", {
    type: "geojson",
    data: stnsGeojson,
  });
  map.addLayer({
    id: "stn-layer",
    type: "circle",
    source: "stations",
    filter: ["<=", ["get", "intensity"], 0],
    paint: {
      "circle-radius": 7 * scale,
      "circle-color": ["get", "color"],
      "circle-opacity": ["get", "opacity"],
      "circle-stroke-width": 0.4,
      "circle-stroke-color": "#ffffff",
    },
  });
  map.addLayer({
    id: "stn-intensity-layer",
    type: "symbol",
    source: "stations",
    filter: [">", ["get", "intensity"], 0],
    layout: {
      "icon-image": ["concat", "stn-int-", ["to-string", ["get", "intensity"]]],
      "icon-size": 0.55 * scale,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-opacity": ["get", "opacity"],
    },
  });

  map.addSource("confirmed-stations", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "confirmed-stn-intensity-layer",
    type: "symbol",
    source: "confirmed-stations",
    layout: {
      "icon-image": ["concat", "stn-int-", ["to-string", ["get", "intensity"]]],
      "icon-size": 0.55 * scale,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
};
