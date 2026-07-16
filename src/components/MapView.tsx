import { useEffect, useRef } from "react";
import { createMap, getMap, onMapReady } from "../map/mapInstance";
import { useAppStore } from "../store";

export const MapView = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setMapReady = useAppStore(state => state.setMapReady);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    createMap(container);
    onMapReady(() => setMapReady(true));

    const resizeObserver = new ResizeObserver(() => getMap().resize());
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [setMapReady]);

  return <div id="map" ref={containerRef} />;
};
