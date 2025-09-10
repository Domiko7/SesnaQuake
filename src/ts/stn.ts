
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

    const source = map.getSource("stations") as maplibregl.GeoJSONSource;
    const currentGeojson = source._data as FeatureCollection<Point, GeoJsonProperties>;

    currentGeojson.features.forEach(f => {
      const target = f.properties?.name;
      const stn = stations.find(stn => stn.name === target);
      if (stn && f.properties) {
        const stationRgb: NiedColorStation = stn?.color;
        if (stationRgb.r !== 0 || stationRgb.g !== 0 || stationRgb.b !== 0 ) {
          f.properties.opacity = 1;
          f.properties.color = `rgb(${stationRgb.r}, ${stationRgb.g}, ${stationRgb.b})`; // TODO MAKE IT APPEAR AFTER
        } else {
          f.properties.opacity = 0;
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
  }, 1000);
};