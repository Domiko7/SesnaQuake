import maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import { addStations } from "../stn.ts";

export const homeLon = 135.01;
export const homeLat = 38.02;

export const map = new maplibregl.Map({
  container: "map",
  style: {
    version: 8,
    sources: {},
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": "#1f1f1f",
        }
      }
    ]
  },
  center: [homeLon, homeLat],
  zoom: 5,
  maxZoom: 12,
  minZoom: 3,
  attributionControl: false,
});

let markers = new Map<string, maplibregl.Marker>();
const countriesGeojson = "geojson/countries.geojson";
const japanGeojson = "geojson/japan.geojson";
const skoreaGeojson = "geojson/skorea.geojson";
const taiwanGeojson = "geojson/taiwan.geojson";
const chinaGeojson = "geojson/china.geojson";


map.on("load", () => {


  addStations();

  map.addSource("waves", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: "S-wave-fill",
    type: "fill",
    source: "waves",
    filter: ["==", ["get", "type"], "S"],
    paint: {
      "fill-color": "#ff2828",
      "fill-opacity": 0.2,
    },
  });

  addGeojson(countriesGeojson, "countries", false);
  addGeojson(japanGeojson, "japan", true);  
  addGeojson(skoreaGeojson, "skorea", false);
  addGeojson(taiwanGeojson, "taiwan", false);
  addGeojson(chinaGeojson, "china", false);

  map.addLayer({
    id: "S-wave-border",
    type: "line",
    source: "waves",
    filter: ["==", ["get", "type"], "S"],
    paint: {
      "line-color": "#ff5656ff",
      "line-width": 2.5,
    },
  });

  map.addLayer({
    id: "P-wave-border",
    type: "line",
    source: "waves",
    filter: ["==", ["get", "type"], "P"],
    paint: {
      "line-color": "#a4c9ffff",
      "line-width": 1,
    },
  });
  

});

export const flyZoom = (lon: number, lat: number, zoom: number, duration: number) => {
  map.flyTo({
    center: [lon, lat],
    zoom: zoom,
    essential: true,
    duration: duration * 1000
  });
};

export const placeMarker = (lon: number, lat: number, width: string, height: string, id: string, icon: string) => {
  const el = document.createElement("div");
  const img = document.createElement("img");
  img.src = icon;
  img.style.width = width;
  img.style.height = height;
  el.appendChild(img);
  const marker = new maplibregl.Marker({ element: el })
  .setLngLat([lon, lat])
  .addTo(map);
  markers.set(id, marker);
  console.log(el);
};

export const deleteMarker = (id: string) => {
  const marker = markers.get(id);
  marker?.remove();
  markers.delete(id);
};

export const addGeojson = (geojson: string, country: string, isOutlined: boolean) => {
  map.addSource(country, {
    type: "geojson",
    data: geojson
  });

  map.addLayer({
    id: `${country}-fills`,
    type: "fill",
    source: country,
    paint: {
      "fill-color": "#292929",
      "fill-opacity": 1,
    }
  });

  if (isOutlined) {
    map.addLayer({
      id: `${country}-borders`,
      type: "line",
      source: country,
      paint: {
        "line-color": "#e3e3e3",
        "line-width": 1,
        "line-opacity": 0.5,
      }
    });
  } else {
    map.addLayer({
      id: `${country}-borders`,
      type: "line",
      source: country,
      paint: {
        "line-color": "#e3e3e3",
        "line-width": 0.5,
        "line-opacity": 0,
      }
    });
  }

  

}


export default map;