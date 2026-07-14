import { useEffect, useRef } from "react";
import { createMap, onMapReady } from "../map/mapInstance";
import { useAppStore } from "../store";

export const MapView = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setMapReady = useAppStore(state => state.setMapReady);

  useEffect(() => {
    if (!containerRef.current) return;

    createMap(containerRef.current);
    onMapReady(() => setMapReady(true));
    
  }, [setMapReady]);

  return <div id="map" ref={containerRef} />;
};
