import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { parseQuakeMl } from "./quakeml";
import { estimateMaxMMI, resolveIntensity } from "./utils";
import { useAppStore } from "../../store";
import type { EqPacket } from "../wsTypes";

const breqEqs = new Map<string, EqPacket>();
const breqLastUpdates = new Map<string, string>();

let isPolling = false;

const refreshBreqEq = async (): Promise<string[]> => {
  const url = "https://breq.pp.ua/fdsnws/event/1/query?nodata=404&limit=15";
  const httpResponse = await corsFetch(url, { headers: { "ngrok-skip-browser-warning": "true" } });
  if (httpResponse.status === 404) return [];
  if (!httpResponse.ok) throw new Error(`BREQ feed returned ${httpResponse.status}`);

  const events = parseQuakeMl(await httpResponse.text());
  const updatedKeys: string[] = [];

  for (const ev of events) {
    if (ev.evaluationMode === "automatic") continue;

    try {
      const updateKey = `${ev.time}|${ev.lat}|${ev.lon}|${ev.depthKm}|${ev.mag}|${ev.evaluationMode}`;
      const isUpdated = breqLastUpdates.get(ev.id) !== updateKey;

      if (isUpdated) {
        const estimatedMMI = await estimateMaxMMI(ev.mag, ev.depthKm, ev.lat, ev.lon);
        const intensity = await resolveIntensity(estimatedMMI, "mmi", ev.mag, ev.depthKm, ev.lat, ev.lon);

        const msg: EqPacket = {
          type: "eq",
          data: {
            source: "breq",
            author: ev.author || "breq",
            agency: ev.agency || "breq",
            id: ev.id,
            mag: ev.mag,
            depth: ev.depthKm,
            intensity,
            location: ev.location,
            time: ev.time,
            lat: ev.lat,
            lon: ev.lon,
          },
        };
        breqEqs.set(ev.id, msg);
        breqLastUpdates.set(ev.id, updateKey);

        updatedKeys.push(ev.id);
      }
    } catch (err) {
      console.error("BREQ event error:", ev.id, err);
    }
  }

  return updatedKeys;
};

const refreshBreqEqs = async (): Promise<void> => {
  const keysToForward = await refreshBreqEq();

  keysToForward.sort((a, b) => breqEqs.get(a)!.data.time - breqEqs.get(b)!.data.time);

  for (const key of keysToForward) {
    dispatchMessage(breqEqs.get(key)!);
  }

  if (breqEqs.size > 100) {
    const keysToRemove = [...breqEqs.entries()]
      .sort((a, b) => a[1].data.time - b[1].data.time)
      .slice(0, 30)
      .map(([key]) => key);
    keysToRemove.forEach((k) => {
      breqEqs.delete(k);
      breqLastUpdates.delete(k);
    });
  }
};

export const startBreqEqSource = (): void => {
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      await refreshBreqEqs();
      useAppStore.getState().setSourceConnection("breq", true);
    } catch (err) {
      useAppStore.getState().setSourceConnection("breq", false);
      console.error("BREQ Polling Loop Error:", err);
    } finally {
      isPolling = false;
    }
  };
  void poll();
  setInterval(poll, 10000);
};
