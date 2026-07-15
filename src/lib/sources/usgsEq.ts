import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { estimateMaxMMI, resolveIntensity } from "./utils";
import { useAppStore } from "../../store";
import type { EqPacket } from "../wsTypes";

interface UsgsFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    updated: number;
    mmi: number | null;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface UsgsGeojsonResponse {
  features: UsgsFeature[];
}

const usgsEqs = new Map<string, EqPacket>();
const usgsLastUpdates = new Map<string, number>();

let isPolling = false;

const refreshUsgsEq = async (): Promise<string[]> => {
  const url = "https://earthquake.usgs.gov/fdsnws/event/1/query?limit=15&format=geojson";
  const httpResponse = await corsFetch(url);
  if (!httpResponse.ok) throw new Error(`USGS feed returned ${httpResponse.status}`);
  const response = await httpResponse.json() as UsgsGeojsonResponse;
  const updatedKeys: string[] = [];

  for (const feature of response.features ?? []) {
    try {
      const isUpdated = usgsLastUpdates.get(feature.id) !== feature.properties.updated;
      if (!isUpdated) continue;

      const [lon, lat, rawDepth] = feature.geometry.coordinates;
      const mag = Number((feature.properties.mag ?? 0).toFixed(1));
      const depth = Number(rawDepth.toFixed(1));
      const mmi = feature.properties.mmi ?? await estimateMaxMMI(mag, depth, lat, lon);
      const intensity = await resolveIntensity(Math.round(mmi), "mmi", mag, depth, lat, lon);

      const msg: EqPacket = {
        type: "eq",
        data: {
          source: "usgs",
          author: "usgs",
          agency: "usgs",
          id: feature.id,
          mag,
          depth,
          intensity,
          location: feature.properties.place ?? "",
          time: feature.properties.time,
          lat,
          lon,
        },
      };
      usgsEqs.set(feature.id, msg);
      usgsLastUpdates.set(feature.id, feature.properties.updated);

      updatedKeys.push(feature.id);
    } catch (err) {
      console.error("USGS event error:", feature?.id, err);
    }
  }

  return updatedKeys;
};

const refreshUsgsEqs = async (): Promise<void> => {
  const keysToForward = await refreshUsgsEq();

  keysToForward.sort((a, b) => usgsEqs.get(a)!.data.time - usgsEqs.get(b)!.data.time);

  for (const key of keysToForward) {
    dispatchMessage(usgsEqs.get(key)!);
  }

  if (usgsEqs.size > 100) {
    const keysToRemove = [...usgsEqs.entries()]
      .sort((a, b) => a[1].data.time - b[1].data.time)
      .slice(0, 30)
      .map(([key]) => key);
    keysToRemove.forEach((k) => {
      usgsEqs.delete(k);
      usgsLastUpdates.delete(k);
    });
  }
};

export const startUsgsEqSource = (): void => {
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      await refreshUsgsEqs();
      useAppStore.getState().setSourceConnection("usgs", true);
    } catch (err) {
      useAppStore.getState().setSourceConnection("usgs", false);
      console.error("USGS Polling Loop Error:", err);
    } finally {
      isPolling = false;
    }
  };
  void poll();
  setInterval(poll, 10000);
};
