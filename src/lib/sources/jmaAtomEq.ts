import { XMLParser } from "fast-xml-parser";
import { corsFetch } from "./http";
import { dispatchMessage } from "./dispatch";
import { shindoToIntensity, resolveIntensity } from "./utils";
import jmaStations from "./assets/jma_stations.json";
import { useAppStore } from "../../store";
import type { EqPacket } from "../wsTypes";

const jmaStationsByCode = new Map(jmaStations.map((s) => [s.code, s]));

interface JmaAtomFeedEntry {
  id: string;
  title: string;
  updated: string;
}

interface JmaAtomFeed {
  feed?: {
    entry?: JmaAtomFeedEntry[];
  };
}

interface JmaEqDetailXml {
  Report: {
    Head: { EventID: string | number };
    Control: { DateTime: string };
    Body: {
      Earthquake: {
        OriginTime?: string;
        "jmx_eb:Magnitude": number;
        Hypocenter: {
          Area: {
            Name: string;
            "jmx_eb:Coordinate": string;
          };
        };
      };
      Intensity?: {
        Observation?: {
          MaxInt?: string;
          Pref?: {
            Area?: {
              Code: string | number;
              MaxInt?: string | number;
              City?: {
                IntensityStation?: {
                  Code: string | number;
                  Int?: string | number;
                }[];
              }[];
            }[];
          }[];
        };
      };
    };
  };
}

const jmaEqs = new Map<string, EqPacket>();
const jmaLastUpdates = new Map<string, string>();
const seenEntries = new Map<string, string>();

let isPolling = false;

const parseCoordinate = (coordinate: unknown): { lat: number | null; lon: number | null; depth: number | null } => {
  const match = String(coordinate).match(/^([+-][\d.]+)([+-][\d.]+)([+-][\d.]+)?/);
  if (!match) return { lat: null, lon: null, depth: null };
  return {
    lat: parseFloat(match[1]),
    lon: parseFloat(match[2]),
    depth: match[3] !== undefined ? Math.abs(parseFloat(match[3])) / 1000 : null,
  };
};

const refreshJmaAtomEq = async (): Promise<string[]> => {
  const url = "https://www.data.jma.go.jp/developer/xml/feed/eqvol_l.xml";
  const parser = new XMLParser({
    isArray: (tagName, jPath) =>
      tagName === "entry" ||
      jPath === "Report.Body.Intensity.Observation.Pref" ||
      jPath === "Report.Body.Intensity.Observation.Pref.Area" ||
      jPath === "Report.Body.Intensity.Observation.Pref.Area.City" ||
      jPath === "Report.Body.Intensity.Observation.Pref.Area.City.IntensityStation",
  });
  const response = await corsFetch(url);
  if (!response.ok) throw new Error(`JMA feed returned ${response.status}`);

  const xmlDoc = parser.parse(await response.text()) as JmaAtomFeed;
  const entries: JmaAtomFeedEntry[] = xmlDoc.feed?.entry ?? [];

  const relevant = entries.filter((eq) => eq.title === "震源・震度に関する情報");

  const feedIds = new Set(relevant.map((eq) => eq.id));
  for (const id of seenEntries.keys()) {
    if (!feedIds.has(id)) seenEntries.delete(id);
  }

  const toFetch = relevant.filter((eq) => seenEntries.get(eq.id) !== eq.updated);

  const fetched = await Promise.all(toFetch.map(async (eq) => {
    try {
      const eqResponse = await corsFetch(eq.id);
      if (!eqResponse.ok) return null;
      const eqXmlDoc = parser.parse(await eqResponse.text()) as JmaEqDetailXml;
      const eventId = String(eqXmlDoc.Report.Head.EventID);
      const updateTime = eqXmlDoc.Report.Control.DateTime;
      const earthquake = eqXmlDoc.Report.Body.Earthquake;
      const { lat, lon, depth } = parseCoordinate(earthquake.Hypocenter.Area["jmx_eb:Coordinate"]);
      const maxInt = eqXmlDoc.Report.Body.Intensity?.Observation?.MaxInt;
      const areas = (eqXmlDoc.Report.Body.Intensity?.Observation?.Pref ?? []).flatMap((pref) => pref.Area ?? []);
      const shindoRegions = areas
        .map((area) => ({ code: String(area.Code), intensity: shindoToIntensity[String(area.MaxInt)] }))
        .filter((region): region is { code: string; intensity: number } => region.intensity !== undefined);
      const intensityStations = areas
        .flatMap((area) => area.City ?? [])
        .flatMap((city) => city.IntensityStation ?? [])
        .map((station) => {
          const ref = jmaStationsByCode.get(String(station.Code).padStart(7, "0"));
          const intensity = shindoToIntensity[String(station.Int)];
          return ref && intensity !== undefined ? { lat: ref.lat, lon: ref.lon, intensity } : null;
        })
        .filter((station): station is { lat: number; lon: number; intensity: number } => station !== null);
      const mag = earthquake["jmx_eb:Magnitude"];
      const intensity = await resolveIntensity(
        (maxInt ? shindoToIntensity[maxInt] : undefined) ?? null,
        "shindo",
        mag,
        depth,
        lat,
        lon,
      );
      const msg = {
        type: "eq",
        data: {
          source: "jma",
          author: "JMA",
          agency: "JMA",
          id: eventId,
          mag,
          depth,
          intensity,
          location: earthquake.Hypocenter.Area.Name,
          time: new Date(earthquake.OriginTime ?? updateTime).getTime(),
          lat,
          lon,
          shindoRegions,
          intensityStations,
        },
      } as unknown as EqPacket;
      seenEntries.set(eq.id, eq.updated);
      return { eventId, updateTime, msg };
    } catch {
      return null;
    }
  }));

  const keysToForward: string[] = [];
  for (const result of fetched) {
    if (!result) continue;
    const { eventId, updateTime, msg } = result;

    const lastUpdate = jmaLastUpdates.get(eventId);
    if (lastUpdate && new Date(updateTime) <= new Date(lastUpdate)) continue;

    jmaEqs.set(eventId, msg);
    jmaLastUpdates.set(eventId, updateTime);
    keysToForward.push(eventId);
  }
  return keysToForward;
};

const refreshJmaEqs = async (): Promise<void> => {
  const keysToForward = await refreshJmaAtomEq();

  keysToForward.sort((a, b) => jmaEqs.get(a)!.data.time - jmaEqs.get(b)!.data.time);

  for (const key of keysToForward) {
    dispatchMessage(jmaEqs.get(key)!);
  }

  if (jmaEqs.size > 100) {
    const keysToRemove = [...jmaEqs.entries()]
      .sort((a, b) => a[1].data.time - b[1].data.time)
      .slice(0, 30)
      .map(([key]) => key);
    keysToRemove.forEach((k) => {
      jmaEqs.delete(k);
      jmaLastUpdates.delete(k);
    });
  }
};

export const startJmaAtomEqSource = (): void => {
  const poll = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      await refreshJmaEqs();
      useAppStore.getState().setSourceConnection("jma", true);
    } catch (err) {
      useAppStore.getState().setSourceConnection("jma", false);
      console.error("JMA Polling Loop Error:", err);
    } finally {
      isPolling = false;
    }
  };
  void poll();
  setInterval(poll, 10000);
};
