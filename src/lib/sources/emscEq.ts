import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { estimateMaxMMI } from "./utils";
import { useAppStore } from "../../store";
import type { EqPacket } from "../wsTypes";

const emscEqs = new Map<string, EqPacket>();
const emscLastUpdates = new Map<string, string>();

let isPolling = false;

const refreshEmscEq = async (): Promise<string[]> => {
  const url = "https://www.seismicportal.eu/fdsnws/event/1/query?format=json&limit=50";
  const httpResponse = await corsFetch(url);
  if (!httpResponse.ok) throw new Error(`EMSC feed returned ${httpResponse.status}`);
  const response = await httpResponse.json();
  const updatedKeys: string[] = [];

  for (const eq of response.features ?? []) {
    try {
      const isUpdated = emscLastUpdates.get(eq.properties.unid) !== eq.properties.lastupdate;

      const authLower = eq?.properties?.auth?.toLowerCase();
      const usgsNetworkAuths = ["neic", "usgs", "scsn", "nc", "hv", "uu", "pr", "ak", "nm", "tx"];
      const { usgs: isUsgsConnected, cenc: isCencConnected, jma: isJmaConnected } = useAppStore.getState().sourceConnections;
      const isDuplicateOfOtherSource =
        (authLower === "cenc" && isCencConnected) ||
        (authLower === "jma" && isJmaConnected) ||
        (authLower === "nied" && isJmaConnected) ||
        authLower === "gns" ||
        (usgsNetworkAuths.includes(authLower) && isUsgsConnected);

      if (isUpdated && !isDuplicateOfOtherSource) {
        const estimatedMMI = await estimateMaxMMI(
          eq.properties.mag,
          eq.properties.depth,
          eq.properties.lat,
          eq.properties.lon,
        );

        const msg: EqPacket = {
          type: "eq",
          data: {
            source: "emsc",
            author: "emsc",
            agency: eq.properties.auth,
            id: eq.properties.unid,
            mag: eq.properties.mag,
            depth: eq.properties.depth,
            intensity: {
              number: estimatedMMI,
              type: "mmi",
            },
            location: eq.properties.flynn_region,
            time: new Date(eq.properties.time).getTime(),
            lat: eq.properties.lat,
            lon: eq.properties.lon,
          },
        };
        emscEqs.set(eq.properties.unid, msg);
        emscLastUpdates.set(eq.properties.unid, eq.properties.lastupdate);

        updatedKeys.push(eq.properties.unid);
      }
    } catch (err) {
      console.error("EMSC event error:", eq?.properties?.unid, err);
    }
  }

  return updatedKeys;
};

const refreshEmscEqs = async (): Promise<void> => {
  const keysToForward = await refreshEmscEq();

  keysToForward.sort((a, b) => emscEqs.get(a)!.data.time - emscEqs.get(b)!.data.time);

  for (const key of keysToForward) {
    dispatchMessage(emscEqs.get(key)!);
  }

  if (emscEqs.size > 100) {
    const keysToRemove = [...emscEqs.entries()]
      .sort((a, b) => a[1].data.time - b[1].data.time)
      .slice(0, 30)
      .map(([key]) => key);
    keysToRemove.forEach((k) => {
      emscEqs.delete(k);
      emscLastUpdates.delete(k);
    });
  }
};

export const startEmscEqSource = (): void => {
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      await refreshEmscEqs();
      useAppStore.getState().setSourceConnection("emsc", true);
    } catch (err) {
      useAppStore.getState().setSourceConnection("emsc", false);
      console.error("EMSC Polling Loop Error:", err);
    } finally {
      isPolling = false;
    }
  };
  void poll();
  setInterval(poll, 20000);
};
