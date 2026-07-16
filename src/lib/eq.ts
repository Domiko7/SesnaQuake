import { playSound } from "./speaker";
import { reportSound } from "./sounds";
import { getSettings } from "./settings";
import { useAppStore } from "../store";
import type { EqPacket } from "./wsTypes";

const WARMUP_MS = 15000;
const REPORT_SOUND_COOLDOWN_MS = 1500;
const startedAt = Date.now();
let lastReportSoundAt = 0;

export const eq = (data: EqPacket): void => {
  const pastEvents = useAppStore.getState().pastEvents;
  const isNew = !pastEvents.some((e) => e.id === data.data.id);
  const latestKnownTime = pastEvents.reduce((max, e) => Math.max(max, e.time), 0);
  const isLatest = data.data.time >= latestKnownTime;

  useAppStore.getState().addPastEvent(data.data);

  const isWarmedUp = Date.now() - startedAt > WARMUP_MS;
  const isOffCooldown = Date.now() - lastReportSoundAt > REPORT_SOUND_COOLDOWN_MS;
  const settings = getSettings();
  if (isNew && isLatest && isWarmedUp && isOffCooldown && settings.soundReportEnabled) {
    lastReportSoundAt = Date.now();
    playSound(settings.customSoundReport || reportSound);
  }
};
