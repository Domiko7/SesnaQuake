import { dispatchMessage } from "./dispatch";
import { estimateMaxCsis, parseUtcDateTime, shindoToIntensity, resolveIntensity } from "./utils";
import { getSettings } from "../settings";
import { useAppStore } from "../../store";
import type { EewData } from "../wsTypes";


let socket: WebSocket | null = null;
let reconnectAttempts = 0;
let connected = false;

export const isWolfxConnected = (): boolean => connected;

const setConnected = (value: boolean) => {
  connected = value;
  useAppStore.getState().setSourceConnection("wolfx", value);
};

const handleMessage = async (e: MessageEvent) => {
  try {
    const data = JSON.parse(e.data);

    if (data.type === "heartbeat") {
      socket?.send("ping");
      return;
    }

    if (data.type === "jma_eew") {
      if (!getSettings().sourceWolfxJma) return;
      if (data.isCancel) {
        dispatchMessage({ type: "eewCancel", data: { id: data.EventID } });
        return;
      }
      dispatchMessage({
        type: "eew",
        data: {
          author: "wolfx",
          agency: "jma",
          id: data.EventID,
          reportNumber: data.Serial,
          mag: data.Magunitude,
          depth: data.Depth,
          intensity: await resolveIntensity(shindoToIntensity[data.MaxIntensity], "shindo", data.Magunitude, data.Depth, data.Latitude, data.Longitude),
          location: data.Hypocenter,
          announcedTime: parseUtcDateTime(data.AnnouncedTime),
          originTime: parseUtcDateTime(data.OriginTime),
          lat: data.Latitude,
          lon: data.Longitude,
          isAssumption: data.isAssumption,
        } as unknown as EewData,
      });
    } else if (data.type === "sc_eew") {
      if (!getSettings().sourceWolfxSc) return;
      dispatchMessage({
        type: "eew",
        data: {
          author: "wolfx",
          agency: "sea",
          id: data.EventID,
          reportNumber: data.ReportNum,
          mag: data.Magunitude,
          depth: data.Depth,
          intensity: await resolveIntensity(Math.round(data.MaxIntensity), "csis", data.Magunitude, data.Depth, data.Latitude, data.Longitude),
          location: data.HypoCenter,
          announcedTime: parseUtcDateTime(data.ReportTime),
          originTime: parseUtcDateTime(data.OriginTime),
          lat: data.Latitude,
          lon: data.Longitude,
          isAssumption: false,
        } as unknown as EewData,
      });
    } else if (data.type === "cenc_eew") {
      if (!getSettings().sourceWolfxCenc) return;
      dispatchMessage({
        type: "eew",
        data: {
          author: "wolfx",
          agency: "cenc",
          id: data.EventID,
          reportNumber: data.ReportNum,
          mag: data.Magnitude,
          depth: data.Depth,
          intensity: await resolveIntensity(Math.round(data.MaxIntensity), "csis", data.Magnitude, data.Depth, data.Latitude, data.Longitude),
          location: data.HypoCenter,
          announcedTime: parseUtcDateTime(data.ReportTime),
          originTime: parseUtcDateTime(data.OriginTime),
          lat: data.Latitude,
          lon: data.Longitude,
          isAssumption: false,
        } as unknown as EewData,
      });
    } else if (data.type === "fj_eew") {
      if (!getSettings().sourceWolfxFj) return;
      const estimated = await estimateMaxCsis(data.Magunitude, 10, data.Latitude, data.Longitude);
      dispatchMessage({
        type: "eew",
        data: {
          author: "wolfx",
          agency: "fea",
          id: data.EventID,
          reportNumber: data.ReportNum,
          mag: data.Magunitude,
          depth: null,
          intensity: await resolveIntensity(estimated, "csis", data.Magunitude, 10, data.Latitude, data.Longitude),
          location: data.HypoCenter,
          announcedTime: parseUtcDateTime(data.ReportTime),
          originTime: parseUtcDateTime(data.OriginTime),
          lat: data.Latitude,
          lon: data.Longitude,
          isAssumption: false,
        } as unknown as EewData,
      });
    } else if (data.type === "cq_eew") {
      if (!getSettings().sourceWolfxCq) return;
      dispatchMessage({
        type: "eew",
        data: {
          author: "wolfx",
          agency: "ceac",
          id: data.EventID,
          reportNumber: data.ReportNum,
          mag: data.Magnitude,
          depth: data.Depth,
          intensity: await resolveIntensity(Math.round(data.MaxIntensity), "csis", data.Magnitude, data.Depth, data.Latitude, data.Longitude),
          location: data.HypoCenter,
          announcedTime: parseUtcDateTime(data.ReportTime),
          originTime: parseUtcDateTime(data.OriginTime),
          lat: data.Latitude,
          lon: data.Longitude,
          isAssumption: false,
        } as unknown as EewData,
      });
    }
  } catch (err) {
    console.warn(`An error occured processing message from wolfx. Error: ${err}`);
  }
};

const scheduleReconnect = () => {
  const timeout = Math.min(10000, 1000 * 2 ** reconnectAttempts);
  reconnectAttempts++;
  console.log(`Wolfx: trying to reconnect in ${timeout}ms... attempt: ${reconnectAttempts}`);
  setTimeout(connect, timeout);
};

const connect = () => {
  try {
    socket = new WebSocket("wss://ws-api.wolfx.jp/all_eew");

    socket.onopen = () => {
      console.log("Wolfx websocket connected! Attempts reset.");
      reconnectAttempts = 0;
      setConnected(true);
    };

    socket.onmessage = handleMessage;

    socket.onclose = (e) => {
      console.log("Wolfx disconnected. Code:", e?.code);
      setConnected(false);
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      console.error("Wolfx WebSocket error: ", err);
      setConnected(false);
      socket?.close();
    };
  } catch (err) {
    console.error("Failed to connect to wolfx websocket: ", err);
    scheduleReconnect();
  }
};

export const startWolfxEewSource = (): void => {
  connect();
};
