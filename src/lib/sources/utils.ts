import { point, distance, booleanPointInPolygon, nearestPointOnLine, polygonToLine, simplify, lineString } from "@turf/turf";
import { estimateShindo, estimateCsis, estimateMmi, estimateCwaShindo, estimateGeonetMmi } from "../shakemap";
import { getSettings } from "../settings";
import { assetUrl } from "../assetUrl";
import type {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";

export const shindoToIntensity: Record<string, number> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5-": 5,
  "5+": 6,
  "6-": 7,
  "6+": 8,
  "7": 9,
};

export const cwaShindoToPga = (intensity: number): number => {
  if (intensity < -0.3) return 0;
  const pga = Math.pow(10, (intensity - 0.7) / 2.0);
  return Math.round(pga * 100) / 100;
};

export const cwaShindoToPgv = (intensity: number): number => {
  if (intensity < 1.89) return 0;
  const pgv = Math.pow(10, (intensity - 1.89) / 2.14);
  return Math.round(pgv * 100) / 100;
};

const SHINDO_JMA_BIN_CENTERS = [0.25, 1.0, 2.0, 3.0, 4.0, 4.75, 5.25, 5.75, 6.25, 6.75];

export const shindoToPgv = (intensity: number): number => {
  if (intensity <= 0) return 0;
  const jma = SHINDO_JMA_BIN_CENTERS[intensity] ?? SHINDO_JMA_BIN_CENTERS[SHINDO_JMA_BIN_CENTERS.length - 1];
  const pgv = Math.pow(10, (jma - 2.68) / 1.72);
  return Math.round(pgv * 100) / 100;
};

export const mmiToPga = (mmi: number): number => {
  if (mmi < 0) return 0;
  const pgaPercentG = Math.pow(10, (mmi - 1.78) / 1.55);
  return Math.round(pgaPercentG * 9.80665 * 100) / 100;
};

export const mmiToPgv = (mmi: number): number => {
  if (mmi < 0) return 0;
  const pgv = Math.pow(10, (mmi - 4.424) / 1.995);
  return Math.round(pgv * 100) / 100;
};

export const parseUtcDateTime = (value: string): number => {
  const m = String(value).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ T](\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
};

export const parseOffsetDateTime = (value: string, offsetHours: number): number => {
  const m = String(value).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ T](\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (!m) return NaN;
  const sign = offsetHours >= 0 ? "+" : "-";
  const pad = (n: number) => String(Math.abs(n)).padStart(2, "0");
  return new Date(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}T${m[4].padStart(2, "0")}:${m[5]}:${m[6]}${sign}${pad(offsetHours)}:00`).getTime();
};

type LandPolygon = Feature<Polygon | MultiPolygon>;

interface CoastChunk {
  coords: Position[];
  bbox: [number, number, number, number];
}

let landPolygons: LandPolygon[] | null = null;
let coastChunks: CoastChunk[] | null = null;
let landLoad: Promise<void> | null = null;

const CHUNK_SIZE = 100;

const chunkRing = (coords: Position[]): CoastChunk[] => {
  const chunks: CoastChunk[] = [];
  for (let i = 0; i < coords.length - 1; i += CHUNK_SIZE - 1) {
    const slice = coords.slice(i, i + CHUNK_SIZE);
    if (slice.length < 2) break;
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const [lon, lat] of slice) {
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    }
    chunks.push({ coords: slice, bbox: [minLon, minLat, maxLon, maxLat] });
  }
  return chunks;
};
const bboxDistanceKm = (lon: number, lat: number, bbox: CoastChunk["bbox"]): number => {
  const clampedLon = Math.min(Math.max(lon, bbox[0]), bbox[2]);
  const clampedLat = Math.min(Math.max(lat, bbox[1]), bbox[3]);
  if (clampedLon === lon && clampedLat === lat) return 0;
  return distance(point([lon, lat]), point([clampedLon, clampedLat]), { units: "kilometers" });
};

const loadWorldLand = (): Promise<void> => {
  landLoad ??= (async () => {
    const response = await fetch(assetUrl("geojson/world_land.geojson"));
    if (!response.ok) throw new Error(`world_land.geojson returned ${response.status}`);
    const fc = (await response.json()) as FeatureCollection;

    landPolygons = fc.features.filter(
      (f): f is LandPolygon => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
    );
    coastChunks = landPolygons.flatMap((f) => {
      const line = polygonToLine(f);
      const features = line.type === "FeatureCollection" ? line.features : [line];
      return features.flatMap((lf) => {
        const simplified = simplify(lf, { tolerance: 0.02, highQuality: false });
        const rings: Position[][] = simplified.geometry.type === "LineString"
          ? [simplified.geometry.coordinates]
          : simplified.geometry.coordinates;
        return rings.flatMap(chunkRing);
      });
    });
  })().catch((err) => {
    landLoad = null;
    throw err;
  });
  return landLoad;
};

const distanceToCoastKm = (lon: number, lat: number): number => {
  const candidates = coastChunks!
    .map((chunk) => ({ chunk, lowerBound: bboxDistanceKm(lon, lat, chunk.bbox) }))
    .sort((a, b) => a.lowerBound - b.lowerBound);

  const epicenter = point([lon, lat]);
  let best = Infinity;
  for (const { chunk, lowerBound } of candidates) {
    if (lowerBound >= best) break;
    const snapped = nearestPointOnLine(lineString(chunk.coords), epicenter, { units: "kilometers" });
    const dist = snapped.properties.dist;
    if (typeof dist === "number" && dist < best) best = dist;
  }
  return best;
};

const epicentralLandDistanceKm = async (lat: number, lon: number): Promise<number> => {
  try {
    await loadWorldLand();
  } catch {
    return 0;
  }

  try {
    const epicenter = point([lon, lat]);
    if (landPolygons!.some((polygon) => booleanPointInPolygon(epicenter, polygon))) return 0;
    const coastKm = distanceToCoastKm(lon, lat);
    return Number.isFinite(coastKm) ? coastKm : 0;
  } catch {
    return 0;
  }
};

export const estimateMaxMMI = async (
  mag: number,
  depth: number,
  lat: number,
  lon: number,
): Promise<number> => {
  const epiDistKm = await epicentralLandDistanceKm(lat, lon);
  return Math.max(1, estimateMmi(mag, depth ?? 0, epiDistKm));
};
export const estimateMaxShindo = async (
  mag: number,
  depth: number,
  lat: number,
  lon: number,
): Promise<number> => {
  const epiDistKm = await epicentralLandDistanceKm(lat, lon);
  return estimateShindo(mag, depth ?? 0, epiDistKm);
};

export const estimateMaxCsis = async (
  mag: number,
  depth: number,
  lat: number,
  lon: number,
): Promise<number> => {
  const epiDistKm = await epicentralLandDistanceKm(lat, lon);
  return Math.max(1, estimateCsis(mag, depth ?? 0, epiDistKm));
};

export const estimateMaxCwaShindo = async (
  mag: number,
  depth: number,
  lat: number,
  lon: number,
): Promise<number> => {
  const epiDistKm = await epicentralLandDistanceKm(lat, lon);
  return estimateCwaShindo(mag, depth ?? 0, epiDistKm);
};

export const estimateMaxGeonetMmi = async (
  mag: number,
  depth: number,
  lat: number,
  lon: number,
): Promise<number> => {
  const epiDistKm = await epicentralLandDistanceKm(lat, lon);
  return Math.max(1, estimateGeonetMmi(mag, depth ?? 0, epiDistKm));
};

export type IntensityType = "mmi" | "shindo" | "csis" | "cwasis" | "geonet_mmi";

const FORCED_INTENSITY_ESTIMATORS: Record<Exclude<IntensityType, never>, typeof estimateMaxMMI> = {
  mmi: estimateMaxMMI,
  shindo: estimateMaxShindo,
  csis: estimateMaxCsis,
  cwasis: estimateMaxCwaShindo,
  geonet_mmi: estimateMaxGeonetMmi,
};

export const resolveIntensity = async <N extends number | null>(
  number: N,
  type: IntensityType,
  mag: number,
  depth: number | null | undefined,
  lat: number | null | undefined,
  lon: number | null | undefined,
): Promise<{ number: N | number; type: IntensityType }> => {
  const force = getSettings().forceIntensity;
  if (force === "off" || force === type) return { number, type };
  return { number: await FORCED_INTENSITY_ESTIMATORS[force](mag, depth ?? 0, lat ?? 0, lon ?? 0), type: force };
};
