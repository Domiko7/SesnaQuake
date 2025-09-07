import { rgb2hsv, getColorPga } from "./utils/color.ts";
import { placeMarker, map } from "./utils/map.ts";
import type { FeatureCollection, GeoJsonProperties, Point } from "geojson";

interface NiedColorStation {
  r: number;
  g: number;
  b: number;
}

interface NiedStation {
  name: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
  color: NiedColorStation;
}

const color2postition = (h: number, s: number, v: number) => {

  let p = 0;
  if (v > 0.1 && s > 0.75) {
			
		if (h > 0.1476) {
			p = 280.31*Math.pow(h,6) - 916.05*Math.pow(h,5) + 1142.6*Math.pow(h,4) - 709.95*Math.pow(h,3) + 234.65*Math.pow(h,2) - 40.27*h + 3.2217;
		}
			
		if (h <= 0.1476 && h > 0.001) {
			p = 151.4*Math.pow(h,4) -49.32*Math.pow(h,3) + 6.753*Math.pow(h,2) -2.481*h + 0.9033;
		}
			
		if (h <= 0.001) {
			p = -0.005171*Math.pow(v,2) - 0.3282*v + 1.2236;
		}
	}

  if ((p ?? 0) < 0) {
    p = 0;
  }

  return p;

};

const position2number = (p: number, unit: string) => {
  switch (unit) {
    case "intensity":
      return (10 * p) - 3;
    case "pga":
      return 10 * ((5 * p) - 2);
    case "pgv":
      return 10 * ((5 * p) - 3);
    case "pgd":
      return 10 * ((5 * p) - 4);
  }
  return p;
};

const addNiedStations = async () => {
  const reference = "other/niedStationsReference.json";
  const response = await fetch(reference);
  const stations: NiedStation[] = (await response.json()) as NiedStation[];
  
  return {
    type: "FeatureCollection",
    features: stations.map(f => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [f.lon, f.lat] },
      properties: {
        name: f.name,
        color: "#414141ff",
        opacity: 1,
      }
    }))
  }
};

export const addStations = async () => {
  const niedStationsGeojson = await addNiedStations();

  map.addSource("stations", {
    type: "geojson",
    data: niedStationsGeojson as FeatureCollection<Point, GeoJsonProperties>,
  });

  map.addLayer({
    id: "stn-later",
    type: "circle",
    source: "stations",
    paint: {
      "circle-radius": 6,
      "circle-color": ["get", "color"],
      "circle-opacity": ["get", "opacity"],
    }
  });

};

const updateNiedStations = async (): Promise<NiedStation[] | undefined> => {
  const url = "https://niedcolor.onrender.com/stations-color";
  const response = await fetch(url);

  if (!response.ok) {
    console.log("Server returned an error:", response.status);
    return;
  }

  try {
    const stations: NiedStation[] = (await response.json()) as NiedStation[];

    //stations.forEach((stn: NiedStation) => {
      //const { lon, lat, name, x, y, color: NiedColorStation} = stn;
      //console.log(lon, lat, name, x, y, stn.color);
      //const hsvColor = rgb2hsv(stn.color.r, stn.color.g, stn.color.b);
      //const position = color2postition(hsvColor[0] / 360, hsvColor[1] / 100, hsvColor[2] / 100);
      //const pga = position2number(position, "pga");
      //const pgaColor = getColorPga(pga);
    //});

    const source = map.getSource("stations") as maplibregl.GeoJSONSource;
    const currentGeojson = source._data as FeatureCollection<Point, GeoJsonProperties>;

    currentGeojson.features.forEach(f => {
      const target = f.properties?.name;
      const stn = stations.find(stn => stn.name === target);
      if (stn) {
        const stationRgb: NiedColorStation = stn?.color;
        if (stationRgb.b !== 0) {
          f.properties!.color = `rgb(${stationRgb.r}, ${stationRgb.g}, ${stationRgb.b})`;
        } else {
          f.properties!.opacity = 0;
        }
      }
    });

    source.setData(currentGeojson);

  } catch (err) {
    console.log("Server error", err);
  }
};

export const realtimeStations = () => {
  setInterval(() => {
    updateNiedStations();
  }, 3000);
};