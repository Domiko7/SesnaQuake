import i18n from "../i18n";

const getColorMmi = (intensity: number) => {
  const mmiColors = ["#464646", "#777777", "#aae0fa", "#6cbce8", "#4cd3c2", "#6cd94e", "#f2db36", "#e59b12", "#dc6e19", "#e24329", "#b81414", "#8f0606", "#500000"];
  try {
    return mmiColors[intensity];
  } catch (err) {
    return mmiColors[0];
  }
};

const getColorShindo = (intensity: number) => {
  const shindoColors = ["#464646", "#2b8cb3", "#3fa887", "#e0b134", "#e88527", "#c92214", "#b01312", "#7c0b53", "#6d0359", "#440375"];
  try {
    return shindoColors[intensity];
  } catch (err) {
    return shindoColors[0];
  }
};

const getNumericIntensityMMI = (intensity: number) => {
  const mmiSymbols = ["-", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return mmiSymbols[intensity] ?? "?";
};

const getNumericIntensityShindo = (intensity: number) => {
  const shindoSymbols = ["-", "1", "2", "3", "4", "5-", "5+", "6-", "6+", "7"];
  return shindoSymbols[intensity] ?? "?";
};

export const getTextColorMmi = (intensity: number) => {
  if (intensity <= 1) return "#f5f5f5";
  return "#1a1a1a";
};

export const getTextColorShindo = (intensity: number) => {
  switch (intensity) {
    case 2:
    case 3:
    case 4:
      return "#1a1a1a";
    default:
      return "#f5f5f5";
  }
};

export const getColor = (intensity: number, intensityType: string) => {
  if (intensityType == "shindo" || intensityType == "cwasis") {
    return getColorShindo(intensity);
  } else if (intensityType == "mmi" || intensityType == "csis" || intensityType == "geonet_mmi") {
    return getColorMmi(intensity);
  }
  return "#414345";
};

export const getTextColor = (intensity: number, intensityType: string) => {
  if (intensityType == "shindo" || intensityType == "cwasis") {
    return getTextColorShindo(intensity);
  } else if (intensityType == "mmi" || intensityType == "csis" || intensityType == "geonet_mmi") {
    return getTextColorMmi(intensity);
  }
  return "#ffffff";
};

export const getShakemapColor = (intensity: number, intensityType: string) => {
  if (intensity != 0) {
    return getColor(intensity, intensityType);
  }
  // TODO: Make it dynamic
  return "#3f4045";
};

export const getTextIntensity = (intensity: number, intensityType: string) => {
  if (intensityType == "shindo" || intensityType == "cwasis") {
    return getNumericIntensityShindo(intensity);
  } else if (intensityType == "mmi" || intensityType == "csis" || intensityType == "geonet_mmi") {
    return getNumericIntensityMMI(intensity);
  }
  return "?";
};

export const getSpokenIntensity = (intensity: number, intensityType: string) => {
  if (intensityType == "shindo") {
    switch (intensity) {
      case 5: return i18n.t("ttsIntensityLower", { n: 5 });
      case 6: return i18n.t("ttsIntensityUpper", { n: 5 });
      case 7: return i18n.t("ttsIntensityLower", { n: 6 });
      case 8: return i18n.t("ttsIntensityUpper", { n: 6 });
      case 9: return "7";
      default: return String(intensity);
    }
  }
  return String(intensity);
};

const PGA_GRADIENT_STOPS = [
  { pga: 0.0,  r: 0,   g: 7,   b: 197 },
  { pga: 0.1,  r: 0,   g: 36,  b: 221 },
  { pga: 0.2,  r: 0,   g: 101, b: 195 },
  { pga: 0.5,  r: 9,   g: 191, b: 141 },
  { pga: 1.0,  r: 26,  g: 235, b: 91 },
  { pga: 2.0,  r: 95,  g: 242, b: 37 },
  { pga: 5.0,  r: 173, g: 244, b: 59 },
  { pga: 10.0, r: 229, g: 244, b: 59 },
  { pga: 20.0, r: 235, g: 192, b: 82 },
  { pga: 50.0, r: 225, g: 125, b: 38 }, 
  { pga: 100.0,r: 235, g: 108, b: 44 },
  { pga: 200.0,r: 235, g: 79,  b: 44 },
  { pga: 500.0,r: 238, g: 41,  b: 31 },
  { pga: 1000.0,r: 136, g: 6,   b: 5 },
];

const rgbToHex = (r: number, g: number, b: number): string =>
  "#" + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, "0")).join("");

export const getColorPga = (pga: number): string => {
  if (pga <= PGA_GRADIENT_STOPS[0].pga) return rgbToHex(PGA_GRADIENT_STOPS[0].r, PGA_GRADIENT_STOPS[0].g, PGA_GRADIENT_STOPS[0].b);
  if (pga >= PGA_GRADIENT_STOPS[PGA_GRADIENT_STOPS.length - 1].pga) {
    const last = PGA_GRADIENT_STOPS[PGA_GRADIENT_STOPS.length - 1];
    return rgbToHex(last.r, last.g, last.b);
  }

  let i = 0;
  while (pga > PGA_GRADIENT_STOPS[i + 1].pga) {
    i++;
  }

  const lower = PGA_GRADIENT_STOPS[i];
  const upper = PGA_GRADIENT_STOPS[i + 1];

  const factor = (pga - lower.pga) / (upper.pga - lower.pga);

  const r = lower.r + factor * (upper.r - lower.r);
  const g = lower.g + factor * (upper.g - lower.g);
  const b = lower.b + factor * (upper.b - lower.b);

  return rgbToHex(r, g, b);
};



const PGV_GRADIENT_STOPS = [
  { pgv: 0.0,   r: 0,   g: 7,   b: 197 },
  { pgv: 0.1,   r: 0,   g: 36,  b: 221 },
  { pgv: 0.5,   r: 0,   g: 101, b: 195 },
  { pgv: 1.1,   r: 9,   g: 191, b: 141 },
  { pgv: 3.4,   r: 26,  g: 235, b: 91 },
  { pgv: 8.1,   r: 95,  g: 242, b: 37 },
  { pgv: 16.0,  r: 173, g: 244, b: 59 },
  { pgv: 31.0,  r: 229, g: 244, b: 59 },
  { pgv: 60.0,  r: 235, g: 192, b: 82 },
  { pgv: 116.0, r: 225, g: 125, b: 38 },
  { pgv: 200.0, r: 235, g: 108, b: 44 },
  { pgv: 300.0, r: 235, g: 79,  b: 44 },
  { pgv: 400.0, r: 238, g: 41,  b: 31 },
  { pgv: 500.0, r: 136, g: 6,   b: 5 },
];

export const getColorPgv = (pgv: number): string => {
  if (pgv <= PGV_GRADIENT_STOPS[0].pgv) {
    return rgbToHex(PGV_GRADIENT_STOPS[0].r, PGV_GRADIENT_STOPS[0].g, PGV_GRADIENT_STOPS[0].b);
  }
  
  if (pgv >= PGV_GRADIENT_STOPS[PGV_GRADIENT_STOPS.length - 1].pgv) {
    const last = PGV_GRADIENT_STOPS[PGV_GRADIENT_STOPS.length - 1];
    return rgbToHex(last.r, last.g, last.b);
  }

  let i = 0;
  while (pgv > PGV_GRADIENT_STOPS[i + 1].pgv) {
    i++;
  }

  const lower = PGV_GRADIENT_STOPS[i];
  const upper = PGV_GRADIENT_STOPS[i + 1];

  const factor = (pgv - lower.pgv) / (upper.pgv - lower.pgv);

  const r = lower.r + factor * (upper.r - lower.r);
  const g = lower.g + factor * (upper.g - lower.g);
  const b = lower.b + factor * (upper.b - lower.b);

  return rgbToHex(r, g, b);
};

export const getCwaShindoIntensity = (pga: number, pgv: number): number => {
  if (pga < 80.0) {
    if (pga < 0.8) return 0;
    if (pga < 2.5) return 1;
    if (pga < 8.0) return 2;
    if (pga < 25.0) return 3;
    return 4;
  }

  if (pgv < 15.0) return 4;
  if (pgv < 30.0) return 5;
  if (pgv < 50.0) return 6;
  if (pgv < 80.0) return 7;
  if (pgv < 140.0) return 8;
  
  return 9;
}