import i18n from "../i18n";
import { TauPTime } from "taup-js";
import { Wave } from "./wave";
import { notify } from "./notify";
import { flyZoom, placeMarker, deleteMarker, getMap, getHomeLon, getHomeLat } from "../map/mapInstance";
import { speak, playSound } from "./speaker";
import { getSpokenIntensity } from "./transform";
import { updateShakemap, removeShakemap } from "./shakemap";
import { computeHomeImpact } from "./homeImpact";
import { getSettings } from "./settings";
import { useAppStore } from "../store";
import { eqSound, updateSound, eew2Sound, eew5Sound, alertSound, resolveAlertStrongSound } from "./sounds";
import { assetUrl } from "./assetUrl";
import type { EewPacket, EewCancelPacket, EewData } from "./wsTypes";

interface EewInternal {
  lastReport: number;
  sWave: Wave;
  pWave: Wave;
}

const internals = new Map<string, EewInternal>();
let switchInterval: ReturnType<typeof setInterval> | undefined;

const taup = new TauPTime();

const isStrong = (intensity: { number: number; type: string }): boolean =>
  intensity.type === "shindo" ? intensity.number >= 5 : intensity.number >= 6;

const homeIntensityFor = (data: EewData): number => {
  const settings = getSettings();
  return computeHomeImpact(data.lat, data.lon, data.mag, data.depth, data.originTime, settings.alertIntensityType).intensity;
};

const checkAlertThresholds = (prevIntensity: number | null, newIntensity: number): void => {
  const settings = getSettings();
  const prev = prevIntensity ?? -Infinity;

  if (newIntensity >= settings.alertStrongThreshold && prev < settings.alertStrongThreshold) {
    if (settings.soundAlertStrongEnabled) playSound(resolveAlertStrongSound(i18n.language));
  } else if (newIntensity >= settings.alertThreshold && prev < settings.alertThreshold) {
    if (settings.soundAlertEnabled) playSound(alertSound);
  }
};

const announce = (data: EewData, isNew: boolean): void => {
  const spokenIntensity = getSpokenIntensity(data.intensity.number, data.intensity.type);
  let text = i18n.t(isNew ? "ttsNewEew" : "ttsUpdateEew", {
    location: data.location,
    intensity: spokenIntensity,
    mag: data.mag,
    depth: data.depth,
  });

  if (isStrong(data.intensity)) {
    text += ` ${i18n.t("ttsStrongShaking")}`;
  }

  speak(1.2, i18n.language, text);
};

const startSwitching = () => {
  clearInterval(switchInterval);
  switchInterval = setInterval(() => useAppStore.getState().cycleActiveEew(), 4000);
};

const addEEW = (data: EewPacket): void => {
  const { agency, id, location, lat, lon, mag, depth, originTime, announcedTime, intensity } = data.data;

  flyZoom(lon, lat, 7, 0.5);

  const soundSettings = getSettings();
  if (intensity.number >= 3 && soundSettings.soundEew2Enabled) playSound(eew2Sound);
  if (intensity.number >= 5 && soundSettings.soundEew5Enabled) playSound(eew5Sound);

  checkAlertThresholds(null, homeIntensityFor(data.data));

  const pSpeed = taup.velocityAt(depth, "P");
  const sSpeed = taup.velocityAt(depth, "S");

  const map = getMap();
  const sWave = new Wave(map, sSpeed, lat, lon, depth, announcedTime - originTime, `${id}-S`, "S");
  const pWave = new Wave(map, pSpeed, lat, lon, depth, announcedTime - originTime, `${id}-P`, "P");
  sWave.addWaveFeature();
  pWave.addWaveFeature();

  internals.set(id, { sWave, pWave, lastReport: Date.now() });
  useAppStore.getState().upsertEew(id, data.data);

  announce(data.data, true);
  notify(intensity.number, intensity.type, `EEW - ${agency.toUpperCase()}`, mag, depth, originTime, location);

  updateShakemap(id, lat, lon, mag, depth);
  placeMarker(lon, lat, "60px", "60px", id, assetUrl("images/epicenter.png"));

  if (internals.size > 1) startSwitching();

  if (soundSettings.soundEqEnabled) playSound(eqSound);
};

const updateEEW = (data: EewPacket): void => {
  const { id, location, lat, lon, mag, depth, originTime, announcedTime, intensity } = data.data;
  const internal = internals.get(id);
  const prevData = useAppStore.getState().eews.get(id);
  let shouldAnnounce = true;

  flyZoom(lon, lat, 7, 1);

  if (internal && prevData) {
    shouldAnnounce =
      prevData.intensity.number !== intensity.number ||
      Math.abs(prevData.mag - mag) >= 0.3 ||
      Math.abs(prevData.depth - depth) >= 10 ||
      prevData.location !== location;

    const soundSettings = getSettings();
    if (intensity.number >= 3 && prevData.intensity.number < 3 && soundSettings.soundEew2Enabled) playSound(eew2Sound);
    if (intensity.number >= 5 && prevData.intensity.number < 5 && soundSettings.soundEew5Enabled) playSound(eew5Sound);

    checkAlertThresholds(homeIntensityFor(prevData), homeIntensityFor(data.data));

    const pSpeed = taup.velocityAt(depth, "P");
    const sSpeed = taup.velocityAt(depth, "S");
    internal.sWave.updateWaveFeature(sSpeed, lat, lon, depth, announcedTime - originTime);
    internal.pWave.updateWaveFeature(pSpeed, lat, lon, depth, announcedTime - originTime);
    internal.lastReport = Date.now();
  }

  useAppStore.getState().upsertEew(id, data.data);

  updateShakemap(id, lat, lon, mag, depth);
  deleteMarker(id);
  placeMarker(lon, lat, "60px", "60px", id, assetUrl("images/epicenter.png"));
  if (shouldAnnounce) announce(data.data, false);
  if (getSettings().soundUpdateEnabled) playSound(updateSound);
};

export const deleteEEW = (id: string): void => {
  const internal = internals.get(id);
  if (!internal) return;

  deleteMarker(id);
  removeShakemap(id);
  internal.sWave.deleteWaveFeature();
  internal.pWave.deleteWaveFeature();
  flyZoom(getHomeLon(), getHomeLat(), 5, 1);
  internals.delete(id);
  useAppStore.getState().deleteEew(id);

  clearInterval(switchInterval);
  if (internals.size > 1) startSwitching();
};

export const eew = (data: EewPacket) => {
  const { lat, lon, id } = data.data;

  setTimeout(() => flyZoom(lon, lat, 6, 0.75), 40000);

  if (!internals.has(id)) {
    addEEW(data);
  } else {
    updateEEW(data);
  }
};

export const eewCancel = (data: EewCancelPacket) => {
  deleteEEW(data.data.id);
};

setInterval(() => {
  for (const [id, current] of internals) {
    if (Date.now() - current.lastReport > 180000) {
      deleteEEW(id);
    }
  }
}, 10000);
