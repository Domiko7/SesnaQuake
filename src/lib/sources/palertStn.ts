
import { dispatchMessage } from "./dispatch";
import palertStations from "./assets/palert_stations.json";
import { useAppStore } from "../../store";
import type { Stn } from "../wsTypes";
import { invoke } from "@tauri-apps/api/core";

interface PalertGraphqlSeries {
  timestamp?: string;
  dataVals?: Record<string, number>;
}

interface PalertGraphqlResponse {
  data: {
    pgaData: PalertGraphqlSeries;
    pgvData: PalertGraphqlSeries;
  };
}

let lastSentData: string | null = null;

const fetchStations = async (): Promise<void> => {
  try {
    const data = await invoke<PalertGraphqlResponse>("fetch_palert_graphql");

    const pgaResult = data?.data?.pgaData;
    const pgvResult = data?.data?.pgvData;

    const updateTime = pgaResult.timestamp
      ? new Date(pgaResult.timestamp).getTime()
      : Date.now();

    const msgStns: Stn[] = [];

    for (const stn of palertStations) {
      const pgaVal = pgaResult.dataVals?.[stn.station] ?? 0;
      const pgvVal = pgvResult.dataVals?.[stn.station] ?? 0;

      msgStns.push({
        author: "sinica",
        agency: "palert",
        code: stn.station,
        name: `${stn.area} - ${stn.locname}`,
        lat: stn.lat,
        lon: stn.lon,
        pga: pgaVal,
        pgv: pgvVal,
        time: updateTime,
      });
    }

    const msgDataString = JSON.stringify(msgStns.map(({ time: _time, ...rest }) => rest));
    if (msgDataString !== lastSentData) {
      lastSentData = msgDataString;
      dispatchMessage({ type: "stn", data: msgStns });
    }
    useAppStore.getState().setSourceConnection("palert", true);
  } catch (err) {
    useAppStore.getState().setSourceConnection("palert", false);
    console.error(`Error when fetching palert stations: ${err}`);
  }
};

export const startPalertStnSource = (): void => {
  setInterval(fetchStations, 3000);
};
