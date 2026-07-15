import { dispatchMessage } from "./dispatch";
import { parseUtcDateTime, parseOffsetDateTime, estimateMaxMMI, estimateMaxCsis, estimateMaxCwaShindo, resolveIntensity } from "./utils";
import { getSettings } from "../settings";
import { useAppStore } from "../../store";
import type { EewData, EqData } from "../wsTypes";
import type { EewSource } from "../../store";
import type { AppSettings } from "../settingsSchema";

let socket: WebSocket | null = null;
let reconnectAttempts = 0;

const setConnected = (value: boolean) => {
  useAppStore.getState().setSourceConnection("fan", value);
};

const lastMd5 = new Map<string, string>();

interface FanEqData {
  id?: string | number;
  eventId?: string;
  shockTime: string;
  latitude: number;
  longitude: number;
  depth?: number | null;
  magnitude?: number | null;
  placeName?: string | null;
}

const fanEqId = (agency: string, d: FanEqData): string => String(d.id ?? d.eventId ?? `${agency}-${d.shockTime}`);

const buildGenericEq = async (source: EqData["source"], d: FanEqData): Promise<EqData> => {
  const mag = d.magnitude ?? 0;
  const depth = d.depth ?? 0;
  const estimatedMMI = await estimateMaxMMI(mag, depth, d.latitude, d.longitude);
  return {
    source,
    author: "fan",
    agency: source,
    id: fanEqId(source, d),
    mag,
    depth,
    intensity: await resolveIntensity(estimatedMMI, "mmi", mag, depth, d.latitude, d.longitude),
    location: d.placeName ?? "",
    time: parseOffsetDateTime(d.shockTime, 8),
    lat: d.latitude,
    lon: d.longitude,
  };
};

const SIMPLE_EQ_SETTING_KEYS: Record<string, keyof AppSettings> = {
  ningxia: "sourceNingxia",
  guangxi: "sourceGuangxi",
  shanxi: "sourceShanxi",
  beijing: "sourceBeijing",
  yunnan: "sourceYunnan",
  hko: "sourceHko",
  bcsf: "sourceBcsf",
  gfz: "sourceGfz",
  usp: "sourceUsp",
  fssn: "sourceFssn",
};

const SIMPLE_EQ_SOURCES: EqData["source"][] = Object.keys(SIMPLE_EQ_SETTING_KEYS) as EqData["source"][];

const buildCencFallback = async (d: FanEqData): Promise<EqData> => {
  const mag = d.magnitude ?? 0;
  const depth = d.depth ?? 0;
  const estimatedCsis = await estimateMaxCsis(mag, depth, d.latitude, d.longitude);
  return {
    source: "cenc",
    author: "fan",
    agency: "cenc",
    id: fanEqId("cenc", d),
    mag,
    depth,
    intensity: await resolveIntensity(estimatedCsis, "csis", mag, depth, d.latitude, d.longitude),
    location: d.placeName ?? "",
    time: parseOffsetDateTime(d.shockTime, 8),
    lat: d.latitude,
    lon: d.longitude,
  };
};

const parseCwaIntensity = (text: string | null | undefined): number => {
  const m = String(text ?? "").match(/\d+/);
  return m ? Number(m[0]) : 0;
};

interface FanCwaData extends FanEqData {
  maxIntensity?: string | null;
}

const buildCwa = async (d: FanCwaData): Promise<EqData> => {
  const mag = d.magnitude ?? 0;
  const depth = d.depth ?? 0;
  return {
    source: "cwa",
    author: "fan",
    agency: "cwa",
    id: fanEqId("cwa", d),
    mag,
    depth,
    intensity: await resolveIntensity(parseCwaIntensity(d.maxIntensity), "cwasis", mag, depth, d.latitude, d.longitude),
    location: d.placeName ?? "",
    time: parseOffsetDateTime(d.shockTime, 8),
    lat: d.latitude,
    lon: d.longitude,
  };
};

interface FanKmaEqData extends FanEqData {
  epiIntensity?: number | string | null;
}

const buildKma = async (d: FanKmaEqData): Promise<EqData> => {
  const mag = d.magnitude ?? 0;
  const depth = d.depth ?? 0;
  return {
    source: "kma",
    author: "fan",
    agency: "kma",
    id: fanEqId("kma", d),
    mag,
    depth,
    intensity: await resolveIntensity(Math.round(Number(d.epiIntensity ?? 0)), "mmi", mag, depth, d.latitude, d.longitude),
    location: d.placeName ?? "",
    time: parseOffsetDateTime(d.shockTime, 9),
    lat: d.latitude,
    lon: d.longitude,
  };
};

interface FanCeaData {
  eventId: string;
  shockTime: string;
  longitude: number;
  latitude: number;
  placeName: string;
  magnitude: number;
  epiIntensity: number;
  depth: number;
  updates: number;
}

const buildCeaEewFallback = async (d: FanCeaData): Promise<EewData> => ({
  author: "fan",
  agency: "cenc",
  id: d.eventId,
  reportNumber: d.updates,
  mag: d.magnitude,
  depth: d.depth,
  intensity: await resolveIntensity(Math.round(d.epiIntensity), "csis", d.magnitude, d.depth, d.latitude, d.longitude),
  location: d.placeName,
  announcedTime: parseUtcDateTime(d.shockTime),
  originTime: parseUtcDateTime(d.shockTime),
  lat: d.latitude,
  lon: d.longitude,
  isAssumption: false,
} as unknown as EewData);

interface FanCwaEewData {
  id: string;
  updates: number;
  shockTime: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  placeName: string;
}

const buildCwaEewFallback = async (d: FanCwaEewData): Promise<EewData> => ({
  author: "fan",
  agency: "cwa",
  id: d.id,
  reportNumber: d.updates,
  mag: d.magnitude,
  depth: d.depth,
  intensity: await resolveIntensity(await estimateMaxCwaShindo(d.magnitude, d.depth, d.latitude, d.longitude), "cwasis", d.magnitude, d.depth, d.latitude, d.longitude),
  location: d.placeName,
  announcedTime: parseUtcDateTime(d.shockTime),
  originTime: parseUtcDateTime(d.shockTime),
  lat: d.latitude,
  lon: d.longitude,
  isAssumption: false,
} as unknown as EewData);

interface FanJmaData {
  id: string;
  updates: number;
  shockTime: string;
  createTime: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  placeName: string;
  epiIntensity: string | number;
  cancel?: boolean;
}

const buildJmaFallback = async (d: FanJmaData): Promise<EewData> => ({
  author: "fan",
  agency: "jma",
  id: d.id,
  reportNumber: d.updates,
  mag: d.magnitude,
  depth: d.depth,
  intensity: await resolveIntensity(Math.round(Number(d.epiIntensity)), "shindo", d.magnitude, d.depth, d.latitude, d.longitude),
  location: d.placeName,
  announcedTime: parseUtcDateTime(d.createTime),
  originTime: parseUtcDateTime(d.shockTime),
  lat: d.latitude,
  lon: d.longitude,
  isAssumption: false,
} as unknown as EewData);

interface FanSaData {
  id: string;
  shockTime: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  placeName: string;
}

const buildSaFallback = async (d: FanSaData): Promise<EewData> => ({
  author: "fan",
  agency: "usgs",
  id: d.id,
  reportNumber: 1,
  mag: d.magnitude,
  depth: d.depth,
  intensity: await resolveIntensity(await estimateMaxMMI(d.magnitude, d.depth, d.latitude, d.longitude), "mmi", d.magnitude, d.depth, d.latitude, d.longitude),
  location: d.placeName,
  announcedTime: parseUtcDateTime(d.shockTime),
  originTime: parseUtcDateTime(d.shockTime),
  lat: d.latitude,
  lon: d.longitude,
  isAssumption: false,
} as unknown as EewData);

interface FanKmaEewData {
  id: string;
  updates: number;
  shockTime: string;
  createTime: string;
  latitude: number;
  longitude: number;
  magnitude: number;
  depth: number;
  epiIntensity: number;
  placeName: string;
}

const buildKmaEew = async (d: FanKmaEewData): Promise<EewData> => ({
  author: "fan",
  agency: "kma",
  id: d.id,
  reportNumber: d.updates,
  mag: d.magnitude,
  depth: d.depth,
  intensity: await resolveIntensity(Math.round(d.epiIntensity), "mmi", d.magnitude, d.depth, d.latitude, d.longitude),
  location: d.placeName,
  announcedTime: parseUtcDateTime(d.createTime),
  originTime: parseUtcDateTime(d.shockTime),
  lat: d.latitude,
  lon: d.longitude,
  isAssumption: false,
} as unknown as EewData);

const primaryDown = (settingKey: keyof AppSettings, connectionKey: EewSource): boolean => {
  const settings = getSettings();
  return Boolean(settings[settingKey]) && !useAppStore.getState().sourceConnections[connectionKey];
};

const handleSourceUpdate = async (source: string, Data: unknown): Promise<void> => {
  const d = Data as never;

  if ((SIMPLE_EQ_SOURCES as string[]).includes(source)) {
    if (!getSettings()[SIMPLE_EQ_SETTING_KEYS[source]]) return;
    dispatchMessage({ type: "eq", data: await buildGenericEq(source as EqData["source"], d) });
    return;
  }

  switch (source) {
    case "cwa":
      if (!getSettings().sourceCwaReport) return;
      dispatchMessage({ type: "eq", data: await buildCwa(d) });
      return;
    case "kma":
      if (!getSettings().sourceKmaReport) return;
      dispatchMessage({ type: "eq", data: await buildKma(d) });
      return;
    case "kma-eew":
      if (!getSettings().sourceKmaEew) return;
      dispatchMessage({ type: "eew", data: await buildKmaEew(d) });
      return;
    case "cenc":
      if (primaryDown("sourceCenc", "cenc")) dispatchMessage({ type: "eq", data: await buildCencFallback(d) });
      return;
    case "cea":
    case "cea-pr":
      if (primaryDown("sourceWolfxCenc", "wolfx")) dispatchMessage({ type: "eew", data: await buildCeaEewFallback(d) });
      return;
    case "cwa-eew":
      if (primaryDown("sourceExptechCwa", "exptechEew")) dispatchMessage({ type: "eew", data: await buildCwaEewFallback(d) });
      return;
    case "jma":
      if (!primaryDown("sourceWolfxJma", "wolfx")) return;
      if ((d as FanJmaData).cancel) dispatchMessage({ type: "eewCancel", data: { id: (d as FanJmaData).id } });
      else dispatchMessage({ type: "eew", data: await buildJmaFallback(d) });
      return;
    case "sa":
      if (primaryDown("sourceShakealert", "shakealert")) dispatchMessage({ type: "eew", data: await buildSaFallback(d) });
      return;
    case "emsc":
      if (primaryDown("sourceEmsc", "emsc")) dispatchMessage({ type: "eq", data: await buildGenericEq("emsc", d) });
      return;
    case "usgs":
      if (primaryDown("sourceUsgs", "usgs")) dispatchMessage({ type: "eq", data: await buildGenericEq("usgs", d) });
      return;
    default:
      return;
  }
};

const handleMessage = async (e: MessageEvent) => {
  try {
    const data = JSON.parse(e.data);

    if (data.type === "heartbeat") {
      socket?.send("ping");
      return;
    }

    if (data.type === "initial_all") {
      for (const [key, value] of Object.entries(data)) {
        if (key === "type") continue;
        const md5 = (value as { md5?: string } | undefined)?.md5;
        if (md5) lastMd5.set(key, md5);
      }
      return;
    }

    if (data.type === "update" && typeof data.source === "string") {
      if (data.md5 && lastMd5.get(data.source) === data.md5) return;
      if (data.md5) lastMd5.set(data.source, data.md5);
      await handleSourceUpdate(data.source, data.Data);
    }
  } catch (err) {
    console.warn(`An error occured processing message from Fan. Error: ${err}`);
  }
};

const scheduleReconnect = () => {
  const timeout = Math.min(10000, 1000 * 2 ** reconnectAttempts);
  reconnectAttempts++;
  console.log(`Fan: trying to reconnect in ${timeout}ms... attempt: ${reconnectAttempts}`);
  setTimeout(connect, timeout);
};

const connect = () => {
  try {
    socket = new WebSocket("wss://ws.fanstudio.tech/all");

    socket.onopen = () => {
      console.log("Fan websocket connected! Attempts reset.");
      reconnectAttempts = 0;
      setConnected(true);
    };

    socket.onmessage = handleMessage;

    socket.onclose = (e) => {
      console.log("Fan disconnected. Code:", e?.code);
      setConnected(false);
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      console.error("Fan WebSocket error: ", err);
      setConnected(false);
      socket?.close();
    };
  } catch (err) {
    console.error("Failed to connect to Fan websocket: ", err);
    scheduleReconnect();
  }
};

export const startFanEewSource = (): void => {
  connect();
};
