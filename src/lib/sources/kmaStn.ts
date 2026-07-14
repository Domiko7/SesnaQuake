import { dispatchMessage } from "./dispatch";
import { mmiToPga, mmiToPgv } from "./utils";
import { useAppStore } from "../../store";
import type { StnPacket } from "../wsTypes";

let socket: WebSocket | null = null;
let reconnectAttempts = 0;

const setConnected = (value: boolean) => {
  useAppStore.getState().setSourceConnection("kmaStn", value);
};

let stationCoords: { latitude: number; longitude: number }[] = [];

const handleMmiUpdate = (mmi: number[]) => {
  if (stationCoords.length === 0) return;
  const now = Date.now();

  const stations = mmi
    .map((value, i) => {
      const coord = stationCoords[i];
      if (!coord || value < 0) return null;
      return {
        agency: "kma",
        author: "kma",
        code: `kma-${i}`,
        lat: coord.latitude,
        lon: coord.longitude,
        name: `KMA ${i}`,
        pga: mmiToPga(value),
        pgv: mmiToPgv(value),
        time: now,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  if (stations.length > 0) dispatchMessage({ type: "stn", data: stations } as StnPacket);
};

const handleMessage = (e: MessageEvent) => {
  try {
    const data = JSON.parse(e.data);

    if (data.type === "heartbeat") {
      socket?.send("ping");
      return;
    }

    if (data.type === "initial_stations" && Array.isArray(data.stations)) {
      stationCoords = data.stations;
      return;
    }

    if ((data.type === "initial" || data.type === "update") && data.source === "kma-station" && Array.isArray(data.Data?.mmi)) {
      handleMmiUpdate(data.Data.mmi);
    }
  } catch (err) {
    console.warn(`An error occured processing message from KMA stations. Error: ${err}`);
  }
};

const scheduleReconnect = () => {
  const timeout = Math.min(10000, 1000 * 2 ** reconnectAttempts);
  reconnectAttempts++;
  console.log(`KMA stations: trying to reconnect in ${timeout}ms... attempt: ${reconnectAttempts}`);
  setTimeout(connect, timeout);
};

const connect = () => {
  try {
    socket = new WebSocket("wss://ws.fanstudio.tech/kma-station");

    socket.onopen = () => {
      console.log("KMA stations websocket connected! Attempts reset.");
      reconnectAttempts = 0;
      setConnected(true);
    };

    socket.onmessage = handleMessage;

    socket.onclose = (e) => {
      console.log("KMA stations disconnected. Code:", e?.code);
      setConnected(false);
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      console.error("KMA stations WebSocket error: ", err);
      setConnected(false);
      socket?.close();
    };
  } catch (err) {
    console.error("Failed to connect to KMA stations websocket: ", err);
    scheduleReconnect();
  }
};

export const startKmaStnSource = (): void => {
  connect();
};
