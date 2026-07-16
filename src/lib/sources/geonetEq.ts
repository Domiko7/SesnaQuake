import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { resolveIntensity } from "./utils";
import { getSettings } from "../settings";
import { getIntensityFromMotion } from "../intensityFromMotion";
import { useAppStore } from "../../store";
import type { EqPacket, Intensity } from "../wsTypes";

interface GeonetFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    publicID: string;
    time: string;
    depth: number;
    magnitude: number;
    mmi: number;
    locality: string;
    quality: string;
  };
}

interface GeonetResponse {
  features: GeonetFeature[];
}

interface GeonetIntensityFeature {
  geometry: { coordinates: [number, number] };
  properties: { mmi: number; pga_h?: number; pgv_h?: number };
}

interface GeonetIntensityResponse {
  features: GeonetIntensityFeature[];
}

type MmiStation = { lat: number; lon: number; intensity: number; pga: number; pgv: number };

const geonetEqs = new Map<string, EqPacket>();
const geonetLastUpdates = new Map<string, string>();
const geonetMmiLastFetch = new Map<string, number>();

const MMI_REFETCH_INTERVAL_MS = 60000;

let isPolling = false;

const fetchMmiStations = async (publicID: string): Promise<MmiStation[]> => {
  try {
    const response = await corsFetch(`https://api.geonet.org.nz/intensity/strong/processed/${publicID}`);
    if (response.status === 204 || !response.ok) return [];
    const data = await response.json() as GeonetIntensityResponse;
    return (data.features ?? [])
      .filter((f) => f.properties.mmi >= 1)
      .map((f) => ({
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        intensity: Math.min(12, Math.round(f.properties.mmi)),
        pga: f.properties.pga_h ?? 0,
        pgv: f.properties.pgv_h ?? 0,
      }));
  } catch (err) {
    console.error("GeoNet intensity fetch error:", publicID, err);
    return [];
  }
};

const fetchFeltReports = async (publicID: string): Promise<MmiStation[]> => {
  try {
    const response = await corsFetch(`https://api.geonet.org.nz/intensity?type=reported&publicID=${publicID}`);
    if (!response.ok) return [];
    const data = await response.json() as GeonetIntensityResponse;
    return (data.features ?? [])
      .filter((f) => f.properties.mmi >= 1)
      .map((f) => ({
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        intensity: Math.min(12, Math.round(f.properties.mmi)),
        pga: 0,
        pgv: 0,
      }));
  } catch (err) {
    console.error("GeoNet felt report fetch error:", publicID, err);
    return [];
  }
};


const peakStation = (mmiStations: MmiStation[]): MmiStation | null =>
  mmiStations.reduce<MmiStation | null>((best, s) => (!best || s.intensity > best.intensity ? s : best), null);

const resolveGeonetIntensity = async (
  nativeMmi: number,
  mmiStations: MmiStation[],
  mag: number,
  depth: number,
  lat: number,
  lon: number,
): Promise<Intensity> => {
  const force = getSettings().forceIntensity;
  if (force === "off" || force === "geonet_mmi") {
    return { number: nativeMmi, type: "geonet_mmi" };
  }
  const peak = peakStation(mmiStations);
  if (peak) {
    return { number: getIntensityFromMotion(force, peak.pga, peak.pgv), type: force };
  }
  return await resolveIntensity(nativeMmi, "geonet_mmi", mag, depth, lat, lon);
};

const refreshGeonetEq = async (): Promise<string[]> => {
  const url = "https://api.geonet.org.nz/quake?MMI=1";
  const httpResponse = await corsFetch(url);
  if (!httpResponse.ok) throw new Error(`GeoNet feed returned ${httpResponse.status}`);
  const response = await httpResponse.json() as GeonetResponse;
  const updatedKeys: string[] = [];

  for (const feature of response.features ?? []) {
    try {
      const { publicID, quality, magnitude } = feature.properties;
      if (quality === "deleted" || feature.properties.mmi < 1) continue;

      const updateKey = `${quality}|${magnitude.toFixed(2)}`;
      const isUpdated = geonetLastUpdates.get(publicID) !== updateKey;
      const existing = geonetEqs.get(publicID);

      if (isUpdated) {
        const [lon, lat] = feature.geometry.coordinates;
        const mag = Number(magnitude.toFixed(1));
        const depth = Number(feature.properties.depth.toFixed(1));
        const measuredStations = await fetchMmiStations(publicID);
        const intensity = await resolveGeonetIntensity(Math.round(feature.properties.mmi), measuredStations, mag, depth, lat, lon);
        const mmiStations = getSettings().sourceGeonetFeltReports
          ? [...measuredStations, ...await fetchFeltReports(publicID)]
          : measuredStations;
        geonetMmiLastFetch.set(publicID, Date.now());
        const msg: EqPacket = {
          type: "eq",
          data: {
            source: "geonet",
            author: "geonet",
            agency: "geonet",
            id: publicID,
            mag,
            depth,
            intensity,
            location: feature.properties.locality,
            time: new Date(feature.properties.time).getTime(),
            lat,
            lon,
            mmiStations,
          },
        };
        geonetEqs.set(publicID, msg);
        geonetLastUpdates.set(publicID, updateKey);

        updatedKeys.push(publicID);
      } else if (existing) {
        const lastFetch = geonetMmiLastFetch.get(publicID) ?? 0;
        if (Date.now() - lastFetch > MMI_REFETCH_INTERVAL_MS) {
          const measuredStations = await fetchMmiStations(publicID);
          const mmiStations = getSettings().sourceGeonetFeltReports
            ? [...measuredStations, ...await fetchFeltReports(publicID)]
            : measuredStations;
          geonetMmiLastFetch.set(publicID, Date.now());
          if (mmiStations.length !== (existing.data.mmiStations?.length ?? 0)) {
            existing.data.mmiStations = mmiStations;
            existing.data.intensity = await resolveGeonetIntensity(
              Math.round(feature.properties.mmi), measuredStations, existing.data.mag, existing.data.depth, existing.data.lat, existing.data.lon,
            );
            updatedKeys.push(publicID);
          }
        }
      }
    } catch (err) {
      console.error("GeoNet event error:", feature?.properties?.publicID, err);
    }
  }

  return updatedKeys;
};

const refreshGeonetEqs = async (): Promise<void> => {
  const keysToForward = await refreshGeonetEq();

  keysToForward.sort((a, b) => geonetEqs.get(a)!.data.time - geonetEqs.get(b)!.data.time);

  const minMag = getSettings().minMagGeonet;
  for (const key of keysToForward) {
    const msg = geonetEqs.get(key)!;
    if (msg.data.mag < minMag) continue;
    dispatchMessage(msg);
  }

  if (geonetEqs.size > 100) {
    const keysToRemove = [...geonetEqs.entries()]
      .sort((a, b) => a[1].data.time - b[1].data.time)
      .slice(0, 30)
      .map(([key]) => key);
    keysToRemove.forEach((k) => {
      geonetEqs.delete(k);
      geonetLastUpdates.delete(k);
      geonetMmiLastFetch.delete(k);
    });
  }
};

export const startGeonetEqSource = (): void => {
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      await refreshGeonetEqs();
      useAppStore.getState().setSourceConnection("geonet", true);
    } catch (err) {
      useAppStore.getState().setSourceConnection("geonet", false);
      console.error("GeoNet Polling Loop Error:", err);
    } finally {
      isPolling = false;
    }
  };
  void poll();
  setInterval(poll, 10000);
};
