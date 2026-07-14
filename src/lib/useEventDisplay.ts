import { useTranslation } from "react-i18next";
import { useAppStore } from "../store";
import { getColor } from "./transform";
import type { Intensity, EqData } from "./wsTypes";

export interface EventDisplay {
  isEew: boolean;
  title: string;
  reportNumber?: number;
  location: string;
  time: number;
  mag: number;
  depth: number;
  intensity: Intensity;
  lat: number;
  lon: number;
  shindoRegions?: { code: string; intensity: number }[];
  intensityStations?: { lat: number; lon: number; intensity: number }[];
  source?: EqData["source"];
}

export const useEventDisplay = (showLatestPastEvent: boolean) => {
  const { t } = useTranslation();
  const activeEewId = useAppStore((s) => s.activeEewId);
  const eews = useAppStore((s) => s.eews);
  const pastEvents = useAppStore((s) => s.pastEvents);
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const active = activeEewId ? eews.get(activeEewId) : undefined;

  const selectedPastEvent = selectedEventId ? pastEvents.find((e) => e.id === selectedEventId) : undefined;
  const fallbackPastEvent = showLatestPastEvent
    ? selectedPastEvent ?? (pastEvents.length ? pastEvents.reduce((latest, e) => (e.time > latest.time ? e : latest)) : undefined)
    : undefined;

  const display: EventDisplay | undefined = active
    ? { isEew: true, title: `EEW - ${active.agency.toUpperCase()}`, reportNumber: active.reportNumber, location: active.location, time: active.originTime, mag: active.mag, depth: active.depth, intensity: active.intensity, lat: active.lat, lon: active.lon }
    : fallbackPastEvent
      ? { isEew: false, title: `${t("earthquake")} - ${fallbackPastEvent.agency.toUpperCase()}`, location: fallbackPastEvent.location, time: fallbackPastEvent.time, mag: fallbackPastEvent.mag, depth: fallbackPastEvent.depth, intensity: fallbackPastEvent.intensity, lat: fallbackPastEvent.lat, lon: fallbackPastEvent.lon, shindoRegions: fallbackPastEvent.shindoRegions, intensityStations: fallbackPastEvent.intensityStations, source: fallbackPastEvent.source }
      : undefined;

  const topBg = display ? getColor(display.intensity.number, display.intensity.type) : "#3a3a3a";

  return { display, topBg };
};
