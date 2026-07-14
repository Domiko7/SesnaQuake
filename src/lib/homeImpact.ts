import { distance, point } from "@turf/turf";
import { TauPTime } from "taup-js";
import { estimateShindo, estimateMmi, estimateCsis, estimateCwaShindo } from "./shakemap";
import { getHomeLat, getHomeLon } from "../map/mapInstance";

export type AlertIntensityType = "shindo" | "mmi" | "csis" | "cwasis";

export interface HomeImpact {
  distanceKm: number;
  intensity: number;
  intensityType: AlertIntensityType;
  pArrivalSec: number | null;
  sArrivalSec: number | null;
}

const taup = new TauPTime();
const DEG_TO_KM = 111.19;

const estimateAtHome = (intensityType: AlertIntensityType, mag: number, depth: number, epiDistKm: number): number => {
  switch (intensityType) {
    case "shindo":
      return estimateShindo(mag, depth, epiDistKm);
    case "mmi":
      return estimateMmi(mag, depth, epiDistKm);
    case "csis":
      return estimateCsis(mag, depth, epiDistKm);
    case "cwasis":
      return estimateCwaShindo(mag, depth, epiDistKm);
  }
};

const phaseSecondsFromNow = (phase: "P" | "S", depthKm: number, distanceKm: number, originTime: number): number => {
  const distanceDeg = distanceKm / DEG_TO_KM;
  const arrival = taup.calculatePhase(phase, depthKm, distanceDeg);
  const arrivalSecFromOrigin = arrival ? arrival.time : Math.sqrt(distanceKm ** 2 + depthKm ** 2) / taup.velocityAt(depthKm, phase);
  return (originTime + arrivalSecFromOrigin * 1000 - Date.now()) / 1000;
};

export const computeHomeImpact = (
  lat: number,
  lon: number,
  mag: number,
  depth: number,
  originTime: number,
  intensityType: AlertIntensityType,
): HomeImpact => {
  const distanceKm = distance(point([getHomeLon(), getHomeLat()]), point([lon, lat]), { units: "kilometers" });

  return {
    distanceKm,
    intensity: estimateAtHome(intensityType, mag, depth, distanceKm),
    intensityType,
    pArrivalSec: phaseSecondsFromNow("P", depth, distanceKm, originTime),
    sArrivalSec: phaseSecondsFromNow("S", depth, distanceKm, originTime),
  };
};
