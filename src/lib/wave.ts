import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import { TauPTime } from "taup-js";
import { getSettings } from "./settings";
import type { Feature } from "geojson";

const waveFeatures = new Map<string, Feature>();
const taup = new TauPTime();

const DEG_TO_KM = 111.19;
const BOUNDARY_SEARCH_ITERATIONS = 9;
const MAX_DEAD_ZONE_SCAN_DEG = 30;
const MIN_SHADOW_ZONE_SCAN_DEG = 60;
const ARRIVAL_TABLE_SAMPLES = 40;

const minDistanceCache = new Map<string, number>();
const maxDistanceCache = new Map<string, number>();

const findMinComputableDistanceDeg = (phase: string, depthKm: number): number => {
  const cacheKey = `${phase}:${depthKm}`;
  const cached = minDistanceCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let result = MAX_DEAD_ZONE_SCAN_DEG;
  if (taup.calculatePhase(phase, depthKm, MAX_DEAD_ZONE_SCAN_DEG)) {
    let lo = 0;
    let hi = MAX_DEAD_ZONE_SCAN_DEG;
    for (let i = 0; i < BOUNDARY_SEARCH_ITERATIONS; i++) {
      const mid = (lo + hi) / 2;
      if (taup.calculatePhase(phase, depthKm, mid)) hi = mid;
      else lo = mid;
    }
    result = hi;
  }

  minDistanceCache.set(cacheKey, result);
  return result;
};

const findMaxComputableDistanceDeg = (phase: string, depthKm: number): number => {
  const cacheKey = `${phase}:${depthKm}`;
  const cached = maxDistanceCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let result = 180;
  if (taup.calculatePhase(phase, depthKm, MIN_SHADOW_ZONE_SCAN_DEG)) {
    let lo = MIN_SHADOW_ZONE_SCAN_DEG;
    let hi = 180;
    for (let i = 0; i < BOUNDARY_SEARCH_ITERATIONS; i++) {
      const mid = (lo + hi) / 2;
      if (taup.calculatePhase(phase, depthKm, mid)) lo = mid;
      else hi = mid;
    }
    result = lo;
  }

  maxDistanceCache.set(cacheKey, result);
  return result;
};

interface ArrivalTableEntry {
  distanceDeg: number;
  timeSec: number;
}

const arrivalTableCache = new Map<string, ArrivalTableEntry[]>();

const buildArrivalTable = (phase: string, depthKm: number, minDeg: number, maxDeg: number): ArrivalTableEntry[] => {
  const cacheKey = `${phase}:${depthKm}`;
  const cached = arrivalTableCache.get(cacheKey);
  if (cached) return cached;

  const table: ArrivalTableEntry[] = [];
  const step = (maxDeg - minDeg) / (ARRIVAL_TABLE_SAMPLES - 1);
  for (let i = 0; i < ARRIVAL_TABLE_SAMPLES; i++) {
    const distanceDeg = minDeg + step * i;
    const arrival = taup.calculatePhase(phase, depthKm, distanceDeg);
    if (arrival) table.push({ distanceDeg, timeSec: arrival.time });
  }

  arrivalTableCache.set(cacheKey, table);
  return table;
};

const interpolateArrivalDistanceDeg = (table: ArrivalTableEntry[], targetTimeSec: number): number | null => {
  if (table.length === 0) return null;
  if (targetTimeSec <= table[0].timeSec) return table[0].distanceDeg;

  const last = table[table.length - 1];
  if (targetTimeSec >= last.timeSec) return last.distanceDeg;

  let lo = 0;
  let hi = table.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid].timeSec <= targetTimeSec) lo = mid;
    else hi = mid;
  }

  const a = table[lo];
  const b = table[hi];
  const t = (targetTimeSec - a.timeSec) / (b.timeSec - a.timeSec);
  return a.distanceDeg + t * (b.distanceDeg - a.distanceDeg);
};

const renderWaves = (map: maplibregl.Map): void => {
  const source = map.getSource("waves") as maplibregl.GeoJSONSource | undefined;
  if (!source) return;
  source.setData({ type: "FeatureCollection", features: [...waveFeatures.values()] });
};

export class Wave {
  map: maplibregl.Map;
  speed: number;
  startLat: number;
  startLon: number;
  depthKm: number;
  id: string;
  waveType: string;

  private baseElapsedMs: number;
  private anchor: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private useAccurateModel = true;
  private minComputableTimeSec: number | null = null;
  private arrivalTable: ArrivalTableEntry[] = [];

  constructor(map: maplibregl.Map, speed: number, startLat: number, startLon: number, depthKm: number, elapsedMs: number, id: string, waveType: string) {
    this.map = map;
    this.speed = speed;
    this.startLat = startLat;
    this.startLon = startLon;
    this.depthKm = depthKm;
    this.baseElapsedMs = elapsedMs;
    this.anchor = Date.now();
    this.id = id;
    this.waveType = waveType;
    this.refreshAccuracySettings();
  }

  private refreshAccuracySettings(): void {
    this.useAccurateModel = getSettings().waveAccuracy !== "estimation";
    if (!this.useAccurateModel) return;

    const minDeg = findMinComputableDistanceDeg(this.waveType, this.depthKm);
    const minArrival = taup.calculatePhase(this.waveType, this.depthKm, minDeg);
    this.minComputableTimeSec = minArrival ? minArrival.time : null;

    const maxDeg = findMaxComputableDistanceDeg(this.waveType, this.depthKm);
    this.arrivalTable = buildArrivalTable(this.waveType, this.depthKm, minDeg, maxDeg);
  }

  private computeRadiusKm(elapsedSec: number): number | null {
    if (this.useAccurateModel && this.minComputableTimeSec !== null && elapsedSec >= this.minComputableTimeSec) {
      const distanceDeg = interpolateArrivalDistanceDeg(this.arrivalTable, elapsedSec);
      if (distanceDeg !== null) return distanceDeg * DEG_TO_KM;
    }

    const traveledKm = this.speed * elapsedSec;
    if (traveledKm <= this.depthKm) return null;
    return Math.sqrt(traveledKm ** 2 - this.depthKm ** 2);
  }

  addWaveFeature(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      const elapsedMs = this.baseElapsedMs + (Date.now() - this.anchor);
      const radiusKm = this.computeRadiusKm(elapsedMs / 1000);

      if (radiusKm === null || radiusKm <= 0) {
        waveFeatures.delete(this.id);
        renderWaves(this.map);
        return;
      }

      const options: { steps: number; units: turf.Units } = { steps: 100, units: "kilometers" };
      const circle = turf.circle([this.startLon, this.startLat], radiusKm, options);

      waveFeatures.set(this.id, {
        ...circle,
        properties: { id: this.id, type: this.waveType },
      });
      renderWaves(this.map);
    }, 45);
  }

  deleteWaveFeature(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    waveFeatures.delete(this.id);
    renderWaves(this.map);
  }

  updateWaveFeature(speed: number, startLat: number, startLon: number, depthKm: number, elapsedMs: number): void {
    this.speed = speed;
    this.startLat = startLat;
    this.startLon = startLon;
    this.depthKm = depthKm;
    this.baseElapsedMs = elapsedMs;
    this.anchor = Date.now();
    this.refreshAccuracySettings();

    this.addWaveFeature();
  }
}
