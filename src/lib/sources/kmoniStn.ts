import { GifReader } from "omggif";
import { invoke } from "@tauri-apps/api/core";
import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import kmoniStations from "./assets/kmoni_stations.json";
import { useAppStore } from "../../store";
import type { Stn } from "../wsTypes";

let lastSentData: string | null = null;

const pad = (n: number): string => String(n).padStart(2, "0");

const jstParameters = (epochMs: number): { date: string; dateTime: string } => {
  const jst = new Date(epochMs + 9 * 3600 * 1000);
  const date = `${jst.getUTCFullYear()}${pad(jst.getUTCMonth() + 1)}${pad(jst.getUTCDate())}`;
  const dateTime = `${date}${pad(jst.getUTCHours())}${pad(jst.getUTCMinutes())}${pad(jst.getUTCSeconds())}`;
  return { date, dateTime };
};

let clockOffsetMs: number | null = null;
let lastSyncAt = 0;

const parseJstDateTime = (value: string): number => {
  const m = String(value).match(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) - 9 * 3600 * 1000;
};

const syncClock = async (): Promise<void> => {
  lastSyncAt = Date.now();
  const response = await corsFetch("http://www.kmoni.bosai.go.jp/webservice/server/pros/latest.json");
  if (!response.ok) throw new Error(`kmoni latest.json returned ${response.status}`);
  const data = await response.json();
  const latestEpoch = parseJstDateTime(data.latest_time);
  if (!Number.isFinite(latestEpoch)) throw new Error(`kmoni latest.json returned ${data.latest_time}`);
  clockOffsetMs = latestEpoch - Date.now();
};

const rgb2hsv = (r: number, g: number, b: number): [number, number, number] => {
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const cmax = Math.max(r, Math.max(g, b));
  const cmin = Math.min(r, Math.min(g, b));
  const diff = cmax - cmin;

  let h = -1;
  const v = cmax;

  if (cmax === cmin) {
    h = 0;
  } else if (cmax === r) {
    h = (60 * ((g - b) / diff) + 360) % 360;
  } else if (cmax === g) {
    h = (60 * ((b - r) / diff) + 120) % 360;
  } else if (cmax === b) {
    h = (60 * ((r - g) / diff) + 240) % 360;
  }

  h = h / 360;
  const s = cmax === 0 ? 0 : diff / cmax;

  return [h, s, v];
};

const color2position = (h: number, s: number, v: number): number => {
  let p = 0;
  if (v > 0.1 && s > 0.75) {
    if (h > 0.1476) {
      p = 280.31 * Math.pow(h, 6) - 916.05 * Math.pow(h, 5) + 1142.6 * Math.pow(h, 4) - 709.95 * Math.pow(h, 3) + 234.65 * Math.pow(h, 2) - 40.27 * h + 3.2217;
    }

    if (h <= 0.1476 && h > 0.001) {
      p = 151.4 * Math.pow(h, 4) - 49.32 * Math.pow(h, 3) + 6.753 * Math.pow(h, 2) - 2.481 * h + 0.9033;
    }

    if (h <= 0.001) {
      p = -0.005171 * Math.pow(v, 2) - 0.3282 * v + 1.2236;
    }
  }

  if ((p ?? 0) < 0) {
    p = 0;
  }

  return p;
};

const position2number = (p: number, unit: "intensity" | "pga" | "pgv" | "pgd"): number => {
  switch (unit) {
    case "intensity":
      return 10 * p - 3;
    case "pga":
      return 10 ** (5 * p - 2);
    case "pgv":
      return 10 ** (5 * p - 3);
    case "pgd":
      return 10 ** (5 * p - 4);
  }
  return p;
};

const fetchStations = async (): Promise<void> => {
  try {
    if (clockOffsetMs === null || Date.now() - lastSyncAt > 5 * 60 * 1000) {
      await syncClock();
    }

    const nowMs = Date.now() + clockOffsetMs! - 500;
    const { date, dateTime } = jstParameters(nowMs);
    const url = `http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/jma_s/${date}/${dateTime}.jma_s.gif`;

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await invoke<ArrayBuffer>("fetch_kmoni_bytes", { url });
    } catch (err) {
      clockOffsetMs = null;
      throw new Error(`kmoni frame fetch failed: ${err}`);
    }

    const buf = new Uint8Array(arrayBuffer);

    if (buf[0] !== 0x47) throw new Error("Not a GIF");

    const reader = new GifReader(buf as ConstructorParameters<typeof GifReader>[0]);

    const width = reader.width;
    const height = reader.height;
    const pixels = new Uint8Array(width * height * 4);

    reader.decodeAndBlitFrameRGBA(0, pixels);

    const msgStns: Stn[] = [];

    for (const stn of kmoniStations) {
      const i = (stn.y * width + stn.x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      if (r === 0 && g === 0 && b === 0) continue;

      const hsv = rgb2hsv(r, g, b);

      const stnPosition = color2position(hsv[0], hsv[1], hsv[2]);
      const stnPga = position2number(stnPosition, "pga");
      const stnPgv = position2number(stnPosition, "pgv");

      msgStns.push({
        author: "kmoni",
        agency: "nied",
        code: stn.station_code,
        name: stn.station_name_en,
        lat: stn.lon,
        lon: stn.lat,
        pga: stnPga,
        pgv: stnPgv,
        time: nowMs,
      });
    }

    const msgDataString = JSON.stringify(msgStns.map(({ time: _time, ...rest }) => rest));
    if (msgDataString !== lastSentData) {
      lastSentData = msgDataString;
      dispatchMessage({ type: "stn", data: msgStns });
    }
    useAppStore.getState().setSourceConnection("kmoni", true);
  } catch (err) {
    useAppStore.getState().setSourceConnection("kmoni", false);
    console.error(`Error when fetching kmoni stations: ${err}`);
  }
};

export const startKmoniStnSource = (): void => {
  setInterval(fetchStations, 1000);
};
