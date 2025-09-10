
import { Wave } from "./utils/wave/wave.ts";
import { travelTimeIris } from "./utils/wave/taup.ts";
//import { notify } from "./utils/notification.ts";
import { flyZoom, placeMarker, deleteMarker, map } from "./utils/map.ts";
import { speak, playSound } from "./utils/speaker.ts";
import { calculateElapsedTimeOfTheWave, parseJMAtime } from "./utils/time.ts";
import { changeEvent, deleteEvent, addEvent } from "./utils/event.ts";
import { homeLon, homeLat } from "./utils/map.ts";
import i18n from "i18next";

const shindoToIntensity = new Map([
  ["1", 1],
  ["2", 1],
  ["3", 3],
  ["4", 4],
  ["5-", 5],
  ["5+", 6],
  ["6-", 7],
  ["6+", 8],
  ["7", 9]
]);

const numericIntensityToMMI = new Map([
  [1, "&#8544;"],
  [2, "&#8545;"],
  [3, "&#8546;"],
  [4, "&#8547;"],
  [5, "&#8548;"],
  [6, "&#8549;"],
  [7, "&#8550;"],
  [8, "&#8551;"],
  [9, "&#8552;"],
  [10, "&#8553;"],
  [11, "&#8554;"],
  [12, "&#8555;"]
]);

interface WarnArea {
  Chiiki: string;
  Shindo1: string;
}

export interface EewData {
  type: string;
  title: string;
  id: string;
  location: string;
  lat: number;
  lon: number
  mag: number;
  depth: number;
  originTime: string;
  announcedTime: string;
  intensity: string;
  reportNumber: number;
  warnArea: WarnArea;
  isPLUM: boolean;
  isCanceled: boolean;
};

interface Earthquake {
  pWave: Wave;
  sWave: Wave;
  lastReport: number;
  alert1: boolean;
  alert2: boolean;
}

let earthquakes = new Map<string, Earthquake>();


const addEEW = (data: EewData): void => {
  const { type, title, id, location, lat, lon, mag, depth, originTime, announcedTime, intensity, reportNumber, warnArea, isPLUM, isCanceled} = data;

  playSound("/sounds/eq.wav");
  
  travelTimeIris(depth, 50).then(waves => {
    const sWave = new Wave(map, Number(waves[1]), lat, lon, calculateElapsedTimeOfTheWave(originTime, announcedTime, type), `${id}-S`, "S");
    const pWave = new Wave(map, Number(waves[0]), lat, lon, calculateElapsedTimeOfTheWave(originTime, announcedTime, type), `${id}-P`, "P");

    console.log(waves);

    sWave?.addWaveFeature();
    pWave?.addWaveFeature();

    earthquakes.set(id, {sWave: sWave, pWave: pWave, lastReport: parseJMAtime(announcedTime), alert1: false, alert2: false});
  });

  speak(1.1, i18n.language, i18n.t("eewLocated", { location: location }));

  setTimeout(() => {
    speak(1.2, i18n.language, i18n.t("jmaEewReport", { number: reportNumber, mag: mag, depth: depth, intensity: intensity }));
  }, 2000);


  //addWaves(`${id}-${Number(reportNumber)}`);


  console.log("added");
  addEvent(mag, intensity, depth, location, originTime, title, "shindo", id, reportNumber);
  placeMarker(lon, lat, "30px", "30px", id, "images/epicenter.png");

  playSound("sounds/eq.mp3");

  if (false) {
    setTimeout(() => {
      deleteEEW(id, `${id}-${Number(reportNumber)}`);
    }, 180000);
  }

};

const updateEEW = (data: EewData): void => {
    const { type, title, id, location, lat, lon, mag, depth, originTime, announcedTime, intensity, reportNumber, warnArea, isPLUM, isCanceled} = data;
    const currentData = earthquakes.get(id);

  if (isCanceled) {
    deleteEEW(id, `${id}-${Number(reportNumber) - 1}`);
  }

  travelTimeIris(depth, 50).then(waves => {
    currentData?.sWave.updateWaveFeature(Number(waves[1]), lat, lon, calculateElapsedTimeOfTheWave(originTime, announcedTime, type));
    currentData?.pWave.updateWaveFeature(Number(waves[0]), lat, lon, calculateElapsedTimeOfTheWave(originTime, announcedTime, type));
  });

  deleteMarker(id);
  placeMarker(lon, lat, "30px", "30px", id, "images/epicenter.png");
  changeEvent(mag, intensity, depth, location, originTime, title, "shindo", id, reportNumber);
  speak(1.2, i18n.language, i18n.t("jmaEewReport", { number: reportNumber, mag: mag, depth: depth, intensity: intensity }));
  playSound("sounds/update.mp3");

  if (currentData) {
    earthquakes.set(id, {...currentData, lastReport: Date.now()});
  };

  console.log("changed");
};



export const deleteEEW = (id: string, waveID: string): void => {
  if (earthquakes.has(id)) {
    const currentData = earthquakes.get(id);
    deleteEvent(id);
    deleteMarker(id);
    currentData?.sWave.deleteWaveFeature();
    currentData?.pWave.deleteWaveFeature();
    flyZoom(homeLon, homeLat, 5, 1);
    earthquakes.delete(id);
    console.log("deleted");
  }
};

export const eew = (data: EewData) => {
  const { type, title, id, location, lat, lon, mag, depth, originTime, announcedTime, intensity, reportNumber, warnArea, isPLUM, isCanceled} = data;

  //notify(intensity,type, mag, depth, originTime, location);
  flyZoom(lon, lat, 7, 1);

  setTimeout(() => {
    flyZoom(lon, lat, 6, 0.75);
  }, 40000);

  if (!earthquakes.has(id)) {
    addEEW(data);
  } else {
    updateEEW(data);
  }

  if ((shindoToIntensity.get(intensity) ?? 0) >= 3) {
    //playSound("sounds/eew_warning.mp3");
  }

  const currentData = earthquakes.get(id);

  setInterval(() => {
    if (currentData && Date.now() - currentData["lastReport"] > 180000) {
      deleteEEW(id, `${id}-${Number(reportNumber)}`);
    }
  }, 10000);

};