import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { resolveIntensity } from "./utils";
import { getSettings } from "../settings";
import { useAppStore } from "../../store";
import type { EewData } from "../wsTypes";

interface UsgsFeature {
  properties: {
    mag: number;
    place: string;
    time: number;
    mmi: number | null;
  };
  geometry: {
    coordinates: [number, number, number];
  };
  id: string;
}

interface UsgsGeojsonResponse {
  features: UsgsFeature[];
}

const seenEvents = new Set<string>();
let isFirstPoll = true;

const refreshShakealertEew = async (): Promise<void> => {
  const url = "https://earthquake.usgs.gov/fdsnws/event/1/query?contributor=ew&limit=5&format=geojson&minmag=4";
  const response = await corsFetch(url);
  if (!response.ok) throw new Error(`ShakeAlert feed returned ${response.status}`);
  const data = await response.json() as UsgsGeojsonResponse;

  for (const feature of data.features) {
    if (seenEvents.has(feature.id)) continue;
    seenEvents.add(feature.id);

    if (isFirstPoll) continue;
    if (feature.properties.mag < getSettings().minMagShakealert) continue;

    const [lon, lat, depth] = feature.geometry.coordinates;
    const intensity = await resolveIntensity(
      Math.round(feature.properties.mmi ?? 0),
      "mmi",
      feature.properties.mag,
      depth,
      lat,
      lon,
    );

    dispatchMessage({
      type: "eew",
      data: {
        author: "shakealert",
        agency: "usgs",
        id: feature.id,
        reportNumber: 1,
        mag: feature.properties.mag,
        depth,
        intensity,
        location: feature.properties.place,
        announcedTime: feature.properties.time,
        originTime: feature.properties.time,
        lat,
        lon,
        isAssumption: false,
      } as unknown as EewData,
    });
  }

  isFirstPoll = false;
};

export const startShakealertEewSource = (): void => {
  setInterval(() => {
    refreshShakealertEew()
      .then(() => useAppStore.getState().setSourceConnection("shakealert", true))
      .catch((err) => {
        useAppStore.getState().setSourceConnection("shakealert", false);
        console.error("ShakeAlert polling error:", err);
      });
  }, 1000);
};
