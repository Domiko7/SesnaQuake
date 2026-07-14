import { getMap } from "../map/mapInstance";
import { getShakemapColor } from "./transform";
import type { GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from "geojson";

type Scale = "shindo" | "mmi" | "csis" | "cwasis";

interface ShakemapRegion {
  id: number;
  feature: Feature<Polygon | MultiPolygon>;
  rings: Position[][];
  scale: Scale;
}

interface EewSource {
  lat: number;
  lon: number;
  mag: number;
  depth: number;
}

const regionFiles: { url: string; scale: Scale }[] = [
  { url: "geojson/shindo.geojson", scale: "shindo" },
  { url: "geojson/cwasis.geojson", scale: "cwasis" },
  { url: "geojson/mmi.geojson", scale: "mmi" },
  { url: "geojson/csis.geojson", scale: "csis" },
];

const regions: ShakemapRegion[] = [];
const activeEews = new Map<string, EewSource>();
let confirmedShindoByCode: Map<string, number> | null = null;

export const estimateShindo = (mag: number, depth: number, epiDistKm: number) => {
  const hypoDistKm = Math.max(Math.sqrt(epiDistKm ** 2 + depth ** 2), 3);
  const logPgv = 0.58 * mag + 0.0038 * depth - 1.29 - Math.log10(hypoDistKm + 0.0028 * 10 ** (0.5 * mag)) - 0.002 * hypoDistKm;
  const pgv = 10 ** logPgv * 1.71;
  const jma = 2.68 + 1.72 * Math.log10(pgv);

  if (jma < 0.5) return 0;
  if (jma < 1.5) return 1;
  if (jma < 2.5) return 2;
  if (jma < 3.5) return 3;
  if (jma < 4.5) return 4;
  if (jma < 5.0) return 5;
  if (jma < 5.5) return 6;
  if (jma < 6.0) return 7;
  if (jma < 6.5) return 8;
  return 9;
};

export const estimateCsis = (mag: number, depth: number, epiDistKm: number) => {
  const hypoDistKm = Math.max(Math.sqrt(epiDistKm ** 2 + depth ** 2), 3);

  const logPgv = 0.58 * mag + 0.0038 * depth - 1.29 - Math.log10(hypoDistKm + 0.0028 * 10 ** (0.5 * mag)) - 0.002 * hypoDistKm;
  const pgv = 10 ** logPgv * 1.71;

  const csis = 3.33 * Math.log10(pgv) + 4.71;

  if (csis < 1.5) return 0;
  if (csis < 2.5) return 2;
  if (csis < 3.5) return 3;
  if (csis < 4.5) return 4;
  if (csis < 5.5) return 5;
  if (csis < 6.5) return 6;
  if (csis < 7.5) return 7;
  if (csis < 8.5) return 8;
  if (csis < 9.5) return 9;
  if (csis < 10.5) return 10;
  if (csis < 11.5) return 11;
  return 12;
};

export const estimateCwaShindo = (mag: number, depth: number, epiDistKm: number) => {
  const hypoDistKm = Math.max(Math.sqrt(epiDistKm ** 2 + depth ** 2), 3);
  const logPga = 0.082 + 0.518 * mag - 1.156 * Math.log10(hypoDistKm) - 0.0033 * hypoDistKm;
  const pga = 10 ** logPga;

  const logPgv = 0.58 * mag + 0.0038 * depth - 1.29 - Math.log10(hypoDistKm + 0.0028 * 10 ** (0.5 * mag)) - 0.002 * hypoDistKm;
  const pgv = 10 ** logPgv * 1.71;

  if (pga < 0.8) return 0;
  if (pga < 2.5) return 1;
  if (pga < 8.0) return 2;
  if (pga < 25.0) return 3;
  if (pga < 80.0) return 4;

  if (pgv < 15.0) return 4;
  if (pgv < 30.0) return 5;
  if (pgv < 50.0) return 6;
  if (pgv < 80.0) return 7;
  if (pgv < 140.0) return 8;
  return 9;
};

const distanceToRegionKm = (lon: number, lat: number, region: ShakemapRegion) => {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  let inside = false;
  let minDegSq = Infinity;

  for (const ring of region.rings) {
    const len = ring.length;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      const pi = ring[i];
      const pj = ring[j];

      const yi = pi[1];
      const yj = pj[1];
      if (yi > lat !== yj > lat) {
        const xIntersect = pi[0] + ((lat - yi) / (yj - yi)) * (pj[0] - pi[0]);
        if (lon < xIntersect) inside = !inside;
      }

      const dx = (pi[0] - lon) * cosLat;
      const dy = pi[1] - lat;
      const degSq = dx * dx + dy * dy;
      if (degSq < minDegSq) minDegSq = degSq;
    }
  }

  if (inside) return 0;
  return Math.sqrt(minDegSq) * 111.19;
};

export const estimateMmi = (mag: number, depth: number, epiDistKm: number) => {
  const hypoDistKm = Math.max(3, Math.sqrt(epiDistKm ** 2 + depth ** 2));
  const rm = -0.209 + 2.042 * Math.exp(mag - 5);
  let mmi = 2.085 + 1.428 * mag - 1.402 * Math.log(Math.sqrt(hypoDistKm ** 2 + rm ** 2));
  if (hypoDistKm > 50) mmi += 0.078 * Math.log(hypoDistKm / 50);
  if (hypoDistKm > 300) mmi -= 0.002 * (hypoDistKm - 300);
  return Math.min(12, Math.max(0, Math.round(mmi)));
};

const renderShakemap = () => {
  const map = getMap();
  if (!map.getSource("shakemap")) return;

  for (const region of regions) {
    const { id, scale } = region;
    let maxIntensity = 0;

    for (const eew of activeEews.values()) {
      const epiDistKm = distanceToRegionKm(eew.lon, eew.lat, region);
      let intensity = 0;
      switch (scale) {
        case "shindo":
          intensity = estimateShindo(eew.mag, eew.depth, epiDistKm);
          break;
        case "mmi":
          intensity = estimateMmi(eew.mag, eew.depth, epiDistKm);
          break;
        case "csis":
          intensity = estimateCsis(eew.mag, eew.depth, epiDistKm);
          break;
        case "cwasis":
          intensity = estimateCwaShindo(eew.mag, eew.depth, epiDistKm);
          break;
        default:
          intensity = 0;
      }
      if (intensity > maxIntensity) maxIntensity = intensity;
    }

    if (scale === "shindo" && confirmedShindoByCode) {
      const code = region.feature.properties?.code;
      const confirmed = code ? confirmedShindoByCode.get(String(code)) : undefined;
      if (confirmed !== undefined && confirmed > maxIntensity) maxIntensity = confirmed;
    }

    map.setFeatureState({ source: "shakemap", id }, { color: getShakemapColor(maxIntensity, scale) });
  }
};

let regionsLoaded: Promise<void> | null = null;

const loadRegions = (): Promise<void> => {
  if (!regionsLoaded) {
    regionsLoaded = Promise.all(regionFiles.map(async ({ url, scale }) => {
      const res = await fetch(url);
      const geojson = await res.json() as FeatureCollection;
      for (const feature of geojson.features) {
        if (feature.geometry?.type === "Polygon") {
          regions.push({ id: regions.length, feature: feature as Feature<Polygon>, rings: feature.geometry.coordinates, scale });
        } else if (feature.geometry?.type === "MultiPolygon") {
          regions.push({ id: regions.length, feature: feature as Feature<MultiPolygon>, rings: feature.geometry.coordinates.flat(), scale });
        }
      }
    })).then(() => {});
  }
  return regionsLoaded;
};

export const initShakemap = () => {
  const map = getMap();

  map.addSource("shakemap", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: "shakemap-fill",
    type: "fill",
    source: "shakemap",
    paint: {
      "fill-color": ["coalesce", ["feature-state", "color"], "#3f4045"],
      "fill-opacity": 1,
    },
  });

  loadRegions().then(() => {
    const source = getMap().getSource("shakemap") as GeoJSONSource;
    source.setData({
      type: "FeatureCollection",
      features: regions.map(({ id, feature }) => ({ ...feature, id })),
    });
    renderShakemap();
  });
};

export const updateShakemap = (id: string, lat: number, lon: number, mag: number, depth: number) => {
  activeEews.set(id, { lat, lon, mag, depth });
  renderShakemap();
};

export const removeShakemap = (id: string) => {
  if (activeEews.delete(id)) {
    renderShakemap();
  }
};

export const updateConfirmedShindo = (regions: { code: string; intensity: number }[]) => {
  confirmedShindoByCode = new Map(regions.map(({ code, intensity }) => [code, intensity]));
  renderShakemap();
};
