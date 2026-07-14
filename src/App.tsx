import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { MapView } from "./components/MapView";
import { Clock } from "./components/Clock";
import { DebugInfo } from "./components/DebugInfo";
import { EventPanel } from "./components/EventPanel";
import { PastEvents } from "./components/PastEvents";
import { SettingsModal } from "./components/SettingsModal";
import { ShakingExpectedBox } from "./components/ShakingExpectedBox";
import { useAppStore } from "./store";
import { useSettingsStore } from "./lib/settings";
import { useEventDisplay } from "./lib/useEventDisplay";
import { placeMarker, deleteMarker, flyZoom, getHomeLon, getHomeLat } from "./map/mapInstance";
import { updateShakemap, removeShakemap, updateConfirmedShindo } from "./lib/shakemap";
import { setStationsVisible, updateConfirmedStations } from "./map/stations";
import { startSources } from "./lib/sources";
import { initNotifications } from "./lib/notify";
import { checkForUpdate } from "./lib/updateCheck";

const LAST_QUAKE_ID = "lastQuake";
const CLOSE_ZOOM_SOURCES = new Set(["jma", "breq", "geonet", "cwa", "kma", "ningxia", "guangxi", "shanxi", "beijing", "yunnan"]);

function App() {
  const mapReady = useAppStore((s) => s.mapReady);
  const hasActiveEew = useAppStore((s) => s.activeEewId !== null);
  const panelMode = useAppStore((s) => s.panelMode);
  const setPanelMode = useAppStore((s) => s.setPanelMode);
  const setSelectedEventId = useAppStore((s) => s.setSelectedEventId);
  const [settingsOpen, setSettingsOpen] = useState(() => useSettingsStore.getState().isFirstLaunch);

  const isRealtimeMode = panelMode === "auto" ? hasActiveEew : panelMode === "realtime";
  const { display, topBg } = useEventDisplay(!isRealtimeMode);

  useEffect(() => {
    if (!mapReady) return;
    startSources();
    initNotifications();
    checkForUpdate();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    deleteMarker(LAST_QUAKE_ID);
    removeShakemap(LAST_QUAKE_ID);
    updateConfirmedShindo(display && !display.isEew ? display.shindoRegions ?? [] : []);
    updateConfirmedStations(display && !display.isEew ? display.intensityStations ?? [] : []);
    if (display && !display.isEew) {
      placeMarker(display.lon, display.lat, "60px", "60px", LAST_QUAKE_ID, "images/epicenter.png");
      updateShakemap(LAST_QUAKE_ID, display.lat, display.lon, display.mag, display.depth);
    }
  }, [mapReady, display?.isEew, display?.lat, display?.lon, display?.mag, display?.depth, display?.shindoRegions, display?.intensityStations]);

  useEffect(() => {
    if (!mapReady) return;
    if (display) {
      const zoom = display.isEew || (display.source && CLOSE_ZOOM_SOURCES.has(display.source)) ? 7 : 5.5;
      flyZoom(display.lon, display.lat, zoom, 1);
    } else {
      flyZoom(getHomeLon(), getHomeLat(), 5, 1);
    }
  }, [mapReady, panelMode, display?.lat, display?.lon, display?.isEew, display?.source]);

  useEffect(() => {
    if (!mapReady) return;
    setStationsVisible(hasActiveEew || panelMode === "realtime");
  }, [mapReady, hasActiveEew, panelMode]);

  return (
    <div id="app">
      <MapView />

      <DebugInfo />

      <div className="elements">
        <button
          id="home-btn"
          className={`btn${panelMode === "auto" ? " active" : ""}`}
          type="button"
          onClick={() => {
            setSelectedEventId(null);
            setPanelMode("auto");
          }}
        >
          <img className="btn-img" src="/images/home.svg" alt="" />
        </button>
        <button
          id="realtime-mode-btn"
          className={`btn${panelMode === "realtime" ? " active" : ""}`}
          type="button"
          onClick={() => setPanelMode("realtime")}
        >
          <img className="btn-img" src="/images/realtime.svg" alt="" />
        </button>
        <button
          id="info-mode-btn"
          className={`btn${panelMode === "past" ? " active" : ""}`}
          type="button"
          onClick={() => setPanelMode("past")}
        >
          <img className="btn-img" src="/images/info.svg" alt="" />
        </button>
        <button id="settings-btn" className="btn" type="button" onClick={() => setSettingsOpen(true)}>
          <img className="btn-img" src="/images/settings.svg" alt="" />
        </button>
        <Clock />
      </div>

      <div className="left-panel" style={{ "--event-panel-top-bg": topBg } as CSSProperties}>
        <EventPanel display={display} />
        {!isRealtimeMode && <PastEvents />}
      </div>

      <ShakingExpectedBox display={display} />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default App;
