
import { eew } from "../../eew";
import { setConnection } from "../../utils/info";

export interface JmaIssueData {
  Source: string;
  Status: string;
}

export interface JmaAccuracyData {
  Epicenter: string;
  Depth: string;
  Magnitude: string;
}

export interface JmaMaxIntChangeData {
  String: string;
  Reason: string;
}

export interface JmaWarnAreaData {
  Chiiki: string;
  Shindo1: string;
  Shindo2: string;
  Time: string;
  Type: string;
  Arrive: boolean;
}

export interface JmaEewData {
  type: string;
  Title: string;
  CodeType: string;
  Issue: JmaIssueData;
  EventID: string;
  Serial: number;
  AnnouncedTime: string;
  OriginTime: string;
  Hypocenter: string;
  Latitude: number;
  Longitude: number;
  Magunitude: number;
  Depth: number;
  MaxIntensity: string;
  Accuracy: JmaAccuracyData;
  MaxIntChange: JmaMaxIntChangeData;
  WarnArea: JmaWarnAreaData;
  isSea: boolean;
  isTraining: boolean;
  isAssumption: boolean;
  isWarn: boolean;
  isFinal: boolean;
  isCancel: boolean;
  OriginalText: string;
}

export let wolfxWebSocket = new WebSocket("wss://ws-api.wolfx.jp/all_eew");
//export let wolfxWebSocket = new WebSocket("ws://localhost:8760");

wolfxWebSocket.onopen = (e) => {
  console.log("Connected!");
  setConnection("info__server-connection-text", true);
};

wolfxWebSocket.onmessage = (e) => {
  const data = JSON.parse(e.data);

  const isJmaEewData = (data: any): data is JmaEewData => {
    return data && data.type === "jma_eew";
  };

  if (isJmaEewData(data)) {
    const { type, Title, EventID, Hypocenter, Latitude, Longitude, Magunitude, Depth, OriginTime, AnnouncedTime, MaxIntensity, Serial, WarnArea, isAssumption, isCancel } = data;
    eew({
      type: type,
      title: Title,
      id: EventID,
      location: Hypocenter,
      lat: Latitude,
      lon: Longitude,
      mag: Magunitude,
      depth: Depth,
      originTime: OriginTime,
      announcedTime: AnnouncedTime,
      intensity: MaxIntensity,
      reportNumber: Serial,
      warnArea: WarnArea,
      isPLUM: isAssumption,
      isCanceled: isCancel,
    });
    console.log(data);
  }
};

wolfxWebSocket.onclose = (e) => {
  console.log("Disconnected");
  setConnection("info__server-connection-text", false);
};

export default wolfxWebSocket;
