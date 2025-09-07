import * as turf from "@turf/turf";
import map from "../map.ts";
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Feature, FeatureCollection } from 'geojson';

const harversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371;

  const deltalat = (lat1 - lat2) * Math.PI / 180;
  const deltalon = (lon1 - lon2) * Math.PI / 180;

  const halfChordLength = Math.sin(deltalat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(deltalon / 2) ** 2;

  const angularDistance = 2 * Math.atan2(Math.sqrt(halfChordLength), Math.sqrt(1 - halfChordLength));

  return radius * angularDistance;
};

export class Wave {
  map: maplibregl.Map;
  time: number;
  startLat: number;
  startLon: number;
  elapsedMs: number;
  id: string;
  waveType: string;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(map: maplibregl.Map, time: number, startLat: number, startLon: number, elapsedMs: number, id: string, waveType: string) {
    this.map = map;
    this.time = time;
    this.startLat = startLat;
    this.startLon = startLon;
    this.elapsedMs = elapsedMs;
    this.id = id;
    this.waveType = waveType;
  }

  addWaveFeature(): void {
    const interval = 45;

    this.timer = setInterval(() => {

      const endLat = this.startLat - 50;
      const endLon = this.startLon - 50;

      let center = [this.startLon, this.startLat];
      const totalDistance = harversineDistance(this.startLat, this.startLon, endLat, endLon);
      let options: {steps: number; units: turf.Units} = { steps: 100, units: "kilometers" };

      this.elapsedMs += interval;
      const progress = Math.min(this.elapsedMs / (this.time * 1000), 1);
      const radius = (Math.PI / 180) * 50 * 6371 * progress;

      const circle = turf.circle(center, radius, options);

      const feature = {
        ...circle,
        properties: {
          id: this.id,
          type: this.waveType,
        }
      };

      const source = this.map.getSource("waves") as maplibregl.GeoJSONSource;

      if (source) {
        const data = source._data as FeatureCollection;

        const updatedFeatures = data.features.filter(f => f.properties?.id !== this.id).concat(feature);

        source.setData({
          type: "FeatureCollection",
          features: updatedFeatures,
        });
      }
      if (progress === 1) {
        clearInterval(this.timer!);
        this.timer = null;
      }

    }, interval);
  }

  deleteWaveFeature(): void {

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    const source = this.map.getSource("waves") as maplibregl.GeoJSONSource;
    const data = source._data as FeatureCollection;

    const updatedFeatures = {
      ...data,
      features: data.features.filter(
        f => f.properties?.id !== this.id
      ),
    };

    source.setData(updatedFeatures);

  }

  updateWaveFeature(time: number, startLat: number, startLon: number, elapsedMs: number): void {
    this.time = time;
    this.startLat = startLat;
    this.startLon = startLon;
    this.elapsedMs = elapsedMs;

    this.deleteWaveFeature();
    this.addWaveFeature();
  }

}
