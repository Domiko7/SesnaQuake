import { getMap } from "../map/mapInstance";
import { getShakemapColor } from "./transform";
import { getSettings } from "./settings";
import { assetUrl } from "./assetUrl";
import { fetchGeojson } from "./geojsonCache";
import type { GeoJSONSource } from "maplibre-gl";
import type { Feature, FeatureCollection, Polygon, MultiPolygon, Position } from "geojson";

type Scale = "shindo" | "mmi" | "csis" | "cwasis" | "geonet_mmi";

interface ShakemapRegion {
  id: number;
  feature: Feature<Polygon | MultiPolygon>;
  rings: Position[][];
  scale: Scale;
  bbox: [number, number, number, number];
}

interface EewSource {
  lat: number;
  lon: number;
  mag: number;
  depth: number;
}

const regionFiles: { url: string; scale: Scale }[] = [
  { url: assetUrl("geojson/shindo.geojson"), scale: "shindo" },
  { url: assetUrl("geojson/cwasis.geojson"), scale: "cwasis" },
  { url: assetUrl("geojson/mmi.geojson"), scale: "mmi" },
  { url: assetUrl("geojson/csis.geojson"), scale: "csis" },
  { url: assetUrl("geojson/geonet_mmi.geojson"), scale: "geonet_mmi" },
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

const CN_GMICE_PGV = { m: 3.2817, b: 3.4163 };

export const estimateCsis = (mag: number, depth: number, epiDistKm: number) => {
  const hypoDistKm = Math.max(Math.sqrt(epiDistKm ** 2 + depth ** 2), 3);

  const logPgv = 0.58 * mag + 0.0038 * depth - 1.29 - Math.log10(hypoDistKm + 0.0028 * 10 ** (0.5 * mag)) - 0.002 * hypoDistKm;
  const pgv = 10 ** logPgv * 1.71;

  const csis = CN_GMICE_PGV.m * Math.log10(pgv) + CN_GMICE_PGV.b;
  return Math.min(12, Math.max(0, Math.round(csis)));
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

const NZ_GMICE_PGV = { a1: 4.107, b1: 1.6323, a2: 1.8970, b2: 3.837, t: 1.0024 };

export const estimateGeonetMmi = (mag: number, depth: number, epiDistKm: number) => {
  const hypoDistKm = Math.max(Math.sqrt(epiDistKm ** 2 + depth ** 2), 3);
  const logPgv = 0.58 * mag + 0.0038 * depth - 1.29 - Math.log10(hypoDistKm + 0.0028 * 10 ** (0.5 * mag)) - 0.002 * hypoDistKm;
  const pgv = 10 ** logPgv * 1.71;
  const logPgvCms = Math.log10(pgv);
  const { a1, b1, a2, b2, t } = NZ_GMICE_PGV;
  const mmi = logPgvCms < t ? b1 * logPgvCms + a1 : b2 * logPgvCms + a2;
  return Math.min(12, Math.max(0, Math.round(mmi)));
};

const feltEstimatorByScale: Record<Scale, (mag: number, depth: number, epiDistKm: number) => number> = {
  shindo: estimateShindo,
  mmi: estimateMmi,
  csis: estimateCsis,
  cwasis: estimateCwaShindo,
  geonet_mmi: estimateGeonetMmi,
};

export const estimateFeltRadiusKm = (mag: number, depth: number, scale: string): number => {
  const estimator = feltEstimatorByScale[scale as Scale] ?? estimateMmi;
  let lo = 0;
  let hi = 2000;
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    if (estimator(mag, depth, mid) >= 1) lo = mid;
    else hi = mid;
  }
  return lo;
};

const litBoundsByScale = new Map<Scale, [number, number, number, number]>();

const renderShakemap = () => {
  const map = getMap();
  if (!map.getSource("shakemap")) return;

  litBoundsByScale.clear();

  const force = getSettings().forceIntensity as Scale | "off";

  for (const region of regions) {
    const { id } = region;
    const scale: Scale = force !== "off" ? force : region.scale;
    const estimator = feltEstimatorByScale[scale] ?? estimateMmi;
    let maxIntensity = 0;

    for (const eew of activeEews.values()) {
      const epiDistKm = distanceToRegionKm(eew.lon, eew.lat, region);
      const intensity = estimator(eew.mag, eew.depth, epiDistKm);
      if (intensity > maxIntensity) maxIntensity = intensity;
    }

    if (scale === "shindo" && confirmedShindoByCode) {
      const code = region.feature.properties?.code;
      const confirmed = code ? confirmedShindoByCode.get(String(code)) : undefined;
      if (confirmed !== undefined && confirmed > maxIntensity) maxIntensity = confirmed;
    }

    if (maxIntensity > 0) {
      const [minLon, minLat, maxLon, maxLat] = region.bbox;
      const existing = litBoundsByScale.get(scale);
      litBoundsByScale.set(scale, existing
        ? [Math.min(existing[0], minLon), Math.min(existing[1], minLat), Math.max(existing[2], maxLon), Math.max(existing[3], maxLat)]
        : [minLon, minLat, maxLon, maxLat]);
    }

    map.setFeatureState({ source: "shakemap", id }, { color: getShakemapColor(maxIntensity, scale) });
  }
};

export const getShakemapBounds = (scale: string): [[number, number], [number, number]] | null => {
  const bounds = litBoundsByScale.get(scale as Scale);
  if (!bounds) return null;
  const [minLon, minLat, maxLon, maxLat] = bounds;
  return [[minLon, minLat], [maxLon, maxLat]];
};

const boundsOfRings = (rings: Position[][]): [number, number, number, number] => {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLon, minLat, maxLon, maxLat];
};

let regionsLoaded: Promise<void> | null = null;

const loadRegions = (): Promise<void> => {
  if (!regionsLoaded) {
    regionsLoaded = Promise.allSettled(regionFiles.map(async ({ url, scale }) => {
      const geojson = await fetchGeojson(url) as FeatureCollection;
      for (const feature of geojson.features) {
        if (feature.geometry?.type === "Polygon") {
          const rings = feature.geometry.coordinates;
          regions.push({ id: regions.length, feature: feature as Feature<Polygon>, rings, scale, bbox: boundsOfRings(rings) });
        } else if (feature.geometry?.type === "MultiPolygon") {
          const rings = feature.geometry.coordinates.flat();
          regions.push({ id: regions.length, feature: feature as Feature<MultiPolygon>, rings, scale, bbox: boundsOfRings(rings) });
        }
      }
    })).then((results) => {
      results.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(`Failed to load "${regionFiles[i].scale}" shakemap regions:`, result.reason);
        }
      });
    });
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
  }).catch((err) => console.error("Failed to load shakemap regions:", err));
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
