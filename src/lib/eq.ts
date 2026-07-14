import { playSound } from "./speaker";
import { useAppStore } from "../store";
import type { EqPacket, Intensity } from "./wsTypes";

import eqInt1Sound from "../assets/sounds/eqInt1.mp3";
import eqInt5Sound from "../assets/sounds/eqInt5.mp3";
import eqInt7Sound from "../assets/sounds/eqInt7.mp3";

export const playEqSound = (intensity: Intensity): void => {
  if (intensity.number >= 7) playSound(eqInt7Sound);
  else if (intensity.number >= 5) playSound(eqInt5Sound);
  else if (intensity.number >= 1) playSound(eqInt1Sound);
};

export const eq = (data: EqPacket): void => {
  useAppStore.getState().addPastEvent(data.data);
};
