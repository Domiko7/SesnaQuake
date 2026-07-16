import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { isWolfxConnected } from "./wolfxEew";
import { estimateMaxShindo, resolveIntensity } from "./utils";
import { getSettings } from "../settings";
import { useAppStore } from "../../store";
import type { EewData } from "../wsTypes";

const exptechEarthquakes = new Map<string, number>();

const isJmaCoveredByFan = (): boolean =>
  getSettings().sourceWolfxJma && useAppStore.getState().sourceConnections.fan;

const refreshExptechEew = async (): Promise<void> => {
  const url = "https://lb-1.exptech.dev/api/v2/eq/eew/";
  const response = await corsFetch(url);
  if (!response.ok) throw new Error(`Exptech eew list returned ${response.status}`);
  const data = await response.json();
  if (!data || !Array.isArray(data) || data.length === 0) return;

  for (const event of data) {
    if (!event.eq) return;

    const { author, id, serial, eq, time } = event;

    const settings = getSettings();
    if (
      (!exptechEarthquakes.has(id) || exptechEarthquakes.get(id) !== serial) &&
      ((author === "cwa" && settings.sourceExptechCwa && eq.mag >= settings.minMagExptechCwa) ||
        (author === "nied" && settings.sourceExptechNied && eq.mag >= settings.minMagExptechNied && !isWolfxConnected() && !isJmaCoveredByFan()))
    ) {
      exptechEarthquakes.set(id, serial);
      const intensity = author === "cwa"
        ? await resolveIntensity(eq.max, "cwasis", eq.mag, eq.depth, eq.lat, eq.lon)
        : await resolveIntensity(await estimateMaxShindo(eq.mag, eq.depth, eq.lat, eq.lon), "shindo", eq.mag, eq.depth, eq.lat, eq.lon);
      dispatchMessage({
        type: "eew",
        data: {
          author: "exptech",
          agency: author,
          id: id,
          reportNumber: serial,
          mag: eq.mag,
          depth: eq.depth,
          intensity: intensity,
          location: eq.loc,
          announcedTime: time,
          originTime: eq.time,
          lat: eq.lat,
          lon: eq.lon,
          isAssumption: false,
        } as unknown as EewData,
      });
    }
  }
};

export const startExptechEewSource = (): void => {
  setInterval(() => {
    refreshExptechEew()
      .then(() => useAppStore.getState().setSourceConnection("exptechEew", true))
      .catch((err) => {
        useAppStore.getState().setSourceConnection("exptechEew", false);
        console.error("Exptech EEW polling error:", err);
      });
  }, 1000);
};
