import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { useAppStore } from "../../store";
import type { EqPacket } from "../wsTypes";

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

const geonetEqs = new Map<string, EqPacket>();
const geonetLastUpdates = new Map<string, string>();

let isPolling = false;

const refreshGeonetEq = async (): Promise<string[]> => {
  const url = "https://api.geonet.org.nz/quake?MMI=1";
  const httpResponse = await corsFetch(url);
  if (!httpResponse.ok) throw new Error(`GeoNet feed returned ${httpResponse.status}`);
  const response = await httpResponse.json() as GeonetResponse;
  const updatedKeys: string[] = [];

  for (const feature of response.features ?? []) {
    try {
      const { publicID, quality, magnitude } = feature.properties;
      if (quality === "deleted") continue;

      const updateKey = `${quality}|${magnitude.toFixed(2)}`;
      const isUpdated = geonetLastUpdates.get(publicID) !== updateKey;

      if (isUpdated && feature.properties.mmi >= 1) {
        const [lon, lat] = feature.geometry.coordinates;
        const msg: EqPacket = {
          type: "eq",
          data: {
            source: "geonet",
            author: "geonet",
            agency: "geonet",
            id: publicID,
            mag: Number(magnitude.toFixed(1)),
            depth: Number(feature.properties.depth.toFixed(1)),
            intensity: {
              number: Math.round(feature.properties.mmi),
              type: "mmi",
            },
            location: feature.properties.locality,
            time: new Date(feature.properties.time).getTime(),
            lat,
            lon,
          },
        };
        geonetEqs.set(publicID, msg);
        geonetLastUpdates.set(publicID, updateKey);

        updatedKeys.push(publicID);
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

  for (const key of keysToForward) {
    dispatchMessage(geonetEqs.get(key)!);
  }

  if (geonetEqs.size > 100) {
    const keysToRemove = [...geonetEqs.entries()]
      .sort((a, b) => a[1].data.time - b[1].data.time)
      .slice(0, 30)
      .map(([key]) => key);
    keysToRemove.forEach((k) => {
      geonetEqs.delete(k);
      geonetLastUpdates.delete(k);
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
  setInterval(poll, 20000);
};
