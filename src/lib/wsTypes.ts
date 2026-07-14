export interface EewPacket {
  type: string;
  data: EewData;
}

export interface EewCancelPacket {
  type: string;
  data: EewCancelData;
}

interface EewCancelData {
  id: string;
}

export interface EewData {
  author: string;
  agency: string;
  id: string;
  reportNumber: number;
  mag: number;
  depth: number;
  intensity: Intensity;
  location: string;
  announcedTime: number;
  originTime: number;
  lat: number;
  lon: number;
  isAssumption: number;
}

export interface EqPacket {
  type: string;
  data: EqData;
}

export interface EqData {
  source: "jma" | "breq" | "cenc" | "emsc" | "geonet"
    | "cwa" | "kma" | "ningxia" | "guangxi" | "shanxi" | "beijing" | "yunnan"
    | "usgs" | "hko" | "bcsf" | "gfz" | "usp" | "fssn";
  author: string;
  agency: string;
  id: string;
  mag: number;
  depth: number;
  intensity: Intensity;
  location: string;
  time: number;
  lat: number;
  lon: number;
  shindoRegions?: { code: string; intensity: number }[];
  intensityStations?: { lat: number; lon: number; intensity: number }[];
}

export interface Intensity {
  number: number;
  type: string;
}

export interface PingPacket {
  type: string;
}

export interface StnPacket {
  type: string;
  data: Stn[];
}

export interface Stn {
  agency: string;
  author: string;
  code: string;
  lat: number;
  lon: number;
  name: string;
  pga: number;
  pgv: number;
  time: number;
  intensity?: number;
}
