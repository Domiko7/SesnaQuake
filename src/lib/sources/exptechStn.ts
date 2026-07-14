import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { cwaShindoToPga, cwaShindoToPgv } from "./utils";
import exptechStationsJson from "./assets/exptech_stations.json";
import { useAppStore } from "../../store";
import type { Stn } from "../wsTypes";

interface ExptechStationInfo {
  net: string;
  info: { code: number; lat: number; lon: number; time: string }[];
  work: boolean;
}

interface ExptechRtsStation {
  I: number;
}

interface ExptechRtsResponse {
  time?: number;
  station: Record<string, ExptechRtsStation>;
}

const exptechStations = exptechStationsJson as Record<string, ExptechStationInfo>;

let lastSentData: string | null = null;

const fetchStations = async (): Promise<void> => {
  try {
    const url = "https://lb-1.exptech.dev/api/v2/trem/rts/";

    const response = await corsFetch(url);
    if (!response.ok) throw new Error(`Exptech rts feed returned ${response.status}`);
    const data = await response.json() as ExptechRtsResponse;

    const msgStns: Stn[] = [];

    for (const [id, stn] of Object.entries(data.station)) {
      const localStn = exptechStations[id];
      const infoData = localStn?.info?.[0];
      if (!infoData) continue;


      // TODO: instead of dispatching it in the same format for everything add an option for "intensity"

      const pga = cwaShindoToPga(stn.I);
      const pgv = cwaShindoToPgv(stn.I);

      msgStns.push({
        author: "exptech",
        agency: "exptech",
        code: id,
        name: `${localStn.net} - ${id}`,
        lat: infoData.lat,
        lon: infoData.lon,
        pga: pga,
        pgv: pgv,
        time: data.time ?? Date.now(),
      });
    }

    const msgDataString = JSON.stringify(msgStns.map(({ time: _time, ...rest }) => rest));
    if (msgDataString !== lastSentData) {
      lastSentData = msgDataString;
      dispatchMessage({ type: "stn", data: msgStns });
    }
    useAppStore.getState().setSourceConnection("exptechStn", true);
  } catch (err) {
    useAppStore.getState().setSourceConnection("exptechStn", false);
    console.error(`Error when fetching exptech stations: ${err}`);
  }
};

export const startExptechStnSource = (): void => {
  setInterval(fetchStations, 1000);
};
