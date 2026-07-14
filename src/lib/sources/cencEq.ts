import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { useAppStore } from "../../store";
import type { EqPacket, Intensity } from "../wsTypes";

interface CencEqEntry {
  type: string;
  ReportTime: string;
  EventID: string;
  magnitude: string;
  depth: string;
  intensity: string;
  placeName: string;
  time: string;
  latitude: string;
  longitude: string;
}

const cencEqs = new Map<string, EqPacket>();
const cencLastUpdates = new Map<string, string>();
let lastMd5: string | null = null;

let isPolling = false;

const refreshCencEq = async (): Promise<string[]> => {
  const url = "https://api.wolfx.jp/cenc_eqlist.json";
  const httpResponse = await corsFetch(url);
  if (!httpResponse.ok) throw new Error(`Wolfx cenc list returned ${httpResponse.status}`);
  const response = await httpResponse.json() as Record<string, unknown>;

  const md5 = typeof response.md5 === "string" ? response.md5 : null;
  if (md5 && md5 === lastMd5) return [];
  lastMd5 = md5;

  const updatedKeys: string[] = [];

  for (const [key, value] of Object.entries(response)) {
    if (key === "md5") continue;
    const eq = value as CencEqEntry;
    try {
      const updateKey = `${eq.type}|${eq.ReportTime}`;
      const isUpdated = cencLastUpdates.get(eq.EventID) !== updateKey;

      if (isUpdated) {
        const intensity = Number(eq.intensity);
        const msg: EqPacket = {
          type: "eq",
          data: {
            source: "cenc",
            author: "wolfx",
            agency: "cenc",
            id: eq.EventID,
            mag: Number(eq.magnitude),
            depth: Number(eq.depth),
            intensity: {
              number: Number.isFinite(intensity) ? intensity : null,
              type: "csis",
            } as Intensity,
            location: eq.placeName,
            time: new Date(`${eq.time.replace(" ", "T")}+08:00`).getTime(),
            lat: Number(eq.latitude),
            lon: Number(eq.longitude),
          },
        };
        cencEqs.set(eq.EventID, msg);
        cencLastUpdates.set(eq.EventID, updateKey);

        updatedKeys.push(eq.EventID);
      }
    } catch (err) {
      console.error("Cenc event error:", eq?.EventID, err);
    }
  }

  return updatedKeys;
};

const refreshCencEqs = async (): Promise<void> => {
  const keysToForward = await refreshCencEq();

  keysToForward.sort((a, b) => cencEqs.get(a)!.data.time - cencEqs.get(b)!.data.time);

  for (const key of keysToForward) {
    dispatchMessage(cencEqs.get(key)!);
  }

  if (cencEqs.size > 100) {
    const keysToRemove = [...cencEqs.entries()]
      .sort((a, b) => a[1].data.time - b[1].data.time)
      .slice(0, 30)
      .map(([key]) => key);
    keysToRemove.forEach((k) => {
      cencEqs.delete(k);
      cencLastUpdates.delete(k);
    });
  }
};

export const startCencEqSource = (): void => {
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      await refreshCencEqs();
      useAppStore.getState().setSourceConnection("cenc", true);
    } catch (err) {
      useAppStore.getState().setSourceConnection("cenc", false);
      console.error("Cenc Polling Loop Error:", err);
    } finally {
      isPolling = false;
    }
  };
  void poll();
  setInterval(poll, 20000);
};
