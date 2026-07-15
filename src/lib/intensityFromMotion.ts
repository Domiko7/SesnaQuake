export type ForceableScale = "shindo" | "mmi" | "csis" | "cwasis" | "geonet_mmi";

const shindoFromPgv = (pgv: number): number => {
  if (pgv <= 0) return 0;
  const jma = 2.68 + 1.72 * Math.log10(pgv);
  if (jma < 0.5) return 0;
  if (jma < 1.5) return 1;
  if (jma < 2.5) return 2;
  if (jma < 3.5) return 3;
  if (jma < 4.5) return 4;
  if (jma < 5.0) return 5;
  if (jma < 5.5) return 6;
  if (jma < 6.0) return 7;
  if (jma < 6.5) return 8;
  return 9;
};

const CN_GMICE_PGV = { m: 3.2817, b: 3.4163 };
const CN_GMICE_PGA = { m: 3.3197, b: 0.0393 };

const csisFromPgv = (pgv: number): number => {
  if (pgv <= 0) return 0;
  const csis = CN_GMICE_PGV.m * Math.log10(pgv) + CN_GMICE_PGV.b;
  return Math.min(12, Math.max(0, Math.round(csis)));
};

const csisFromPga = (pga: number): number => {
  if (pga <= 0) return 0;
  const csis = CN_GMICE_PGA.m * Math.log10(pga) + CN_GMICE_PGA.b;
  return Math.min(12, Math.max(0, Math.round(csis)));
};

const csisFromMotion = (pga: number, pgv: number): number =>
  pgv > 0 ? csisFromPgv(pgv) : csisFromPga(pga);

const cwasisFromMotion = (pga: number, pgv: number): number => {
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
};

const mmiFromPgv = (pgv: number): number => {
  if (pgv <= 0) return 0;
  const mmi = Math.log10(pgv) * 1.995 + 4.424;
  return Math.min(12, Math.max(0, Math.round(mmi)));
};

const NZ_GMICE_PGV = { a1: 4.107, b1: 1.6323, a2: 1.8970, b2: 3.837, t: 1.0024 };
const NZ_GMICE_PGA = { a1: 1.7601, b1: 1.992, a2: -1.9095, b2: 3.9322, t: 1.89137 };

const geonetMmiFromPgv = (pgv: number): number => {
  if (pgv <= 0) return 0;
  const logPgv = Math.log10(pgv);
  const { a1, b1, a2, b2, t } = NZ_GMICE_PGV;
  const mmi = logPgv < t ? b1 * logPgv + a1 : b2 * logPgv + a2;
  return Math.min(12, Math.max(0, Math.round(mmi)));
};

const geonetMmiFromPga = (pga: number): number => {
  if (pga <= 0) return 0;
  const logPga = Math.log10(pga);
  const { a1, b1, a2, b2, t } = NZ_GMICE_PGA;
  const mmi = logPga < t ? b1 * logPga + a1 : b2 * logPga + a2;
  return Math.min(12, Math.max(0, Math.round(mmi)));
};

const geonetMmiFromMotion = (pga: number, pgv: number): number =>
  pgv > 0 ? geonetMmiFromPgv(pgv) : geonetMmiFromPga(pga);

export const geonetMmiToPgv = (mmi: number): number => {
  const { a1, b1, a2, b2, t } = NZ_GMICE_PGV;
  const tMmi = b1 * t + a1;
  const logPgv = mmi < tMmi ? (mmi - a1) / b1 : (mmi - a2) / b2;
  return 10 ** logPgv;
};

export const getIntensityFromMotion = (scale: ForceableScale, pga: number, pgv: number): number => {
  switch (scale) {
    case "shindo":
      return shindoFromPgv(pgv);
    case "csis":
      return csisFromMotion(pga, pgv);
    case "cwasis":
      return cwasisFromMotion(pga, pgv);
    case "geonet_mmi":
      return geonetMmiFromMotion(pga, pgv);
    case "mmi":
    default:
      return mmiFromPgv(pgv);
  }
};

export const iconFamilyForScale = (scale: string): "shindo" | "mmi" =>
  scale === "shindo" || scale === "cwasis" ? "shindo" : "mmi";
