import { XMLParser } from "fast-xml-parser";

export interface QuakeMlEvent {
  id: string;
  time: number;
  lat: number;
  lon: number;
  depthKm: number;
  mag: number;
  magType: string;
  eventType: string;
  location: string;
  evaluationMode: string;
  agency: string;
  author: string;
}

interface QuakeMlOrigin {
  "@_publicID": string;
  time: { value: string };
  latitude: { value: string | number };
  longitude: { value: string | number };
  depth?: { value: string | number };
  evaluationMode?: string;
}

interface QuakeMlMagnitude {
  "@_publicID": string;
  mag: { value: string | number };
  type?: string;
}

interface QuakeMlEventNode {
  "@_publicID": string;
  description?: { text?: string };
  creationInfo?: { agencyID?: string; author?: string };
  origin?: QuakeMlOrigin[];
  magnitude?: QuakeMlMagnitude[];
  preferredOriginID?: string;
  preferredMagnitudeID?: string;
  type?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => tagName === "event" || tagName === "origin" || tagName === "magnitude",
});

export const parseQuakeMl = (xmlText: string): QuakeMlEvent[] => {
  const doc = parser.parse(xmlText);
  const events: QuakeMlEventNode[] = doc["q:quakeml"]?.eventParameters?.event ?? [];

  const results: QuakeMlEvent[] = [];
  for (const event of events) {
    try {
      const origins = event.origin ?? [];
      const magnitudes = event.magnitude ?? [];
      const origin = origins.find((o) => o["@_publicID"] === event.preferredOriginID) ?? origins[0];
      const magnitude = magnitudes.find((m) => m["@_publicID"] === event.preferredMagnitudeID) ?? magnitudes[0];
      if (!origin || !magnitude) continue;

      results.push({
        id: String(event["@_publicID"]).split("/").pop() ?? event["@_publicID"],
        time: new Date(origin.time.value).getTime(),
        lat: Number(origin.latitude.value),
        lon: Number(origin.longitude.value),
        depthKm: Number(origin.depth?.value ?? 0) / 1000,
        mag: Number(magnitude.mag.value),
        magType: String(magnitude.type ?? ""),
        eventType: String(event.type ?? ""),
        location: String(event.description?.text ?? ""),
        evaluationMode: String(origin.evaluationMode ?? ""),
        agency: String(event.creationInfo?.agencyID ?? ""),
        author: String(event.creationInfo?.author ?? ""),
      });
    } catch {
      continue;
    }
  }
  return results;
};
