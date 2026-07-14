import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVersion } from "@tauri-apps/api/app";
import { useAppStore } from "../store";

const SOURCE_LABELS: Record<string, string> = {
  wolfx: "Wolfx",
  fan: "Fan",
  exptechEew: "Exptech",
  cenc: "CENC",
  jma: "JMA",
  emsc: "EMSC",
  geonet: "GeoNet",
  breq: "BREQ",
  kmoni: "Kmoni",
  exptechStn: "Exptech Stations",
  palert: "P-alert",
  shakealert: "ShakeAlert",
  kmaStn: "KMA Stations",
  usgs: "USGS"
};

export const DebugInfo = () => {
  const { t } = useTranslation();
  const sourceConnections = useAppStore((s) => s.sourceConnections);
  const updateAvailable = useAppStore((s) => s.updateAvailable);
  const latestVersion = useAppStore((s) => s.latestVersion);
  const [fps, setFps] = useState<number | null>(null);
  const [version, setVersion] = useState<string>(__APP_VERSION__);

  useEffect(() => {
    getVersion().then(setVersion).catch(() => {});
  }, []);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      frames++;
      if (now - lastTime >= 1000) {
        setFps(frames);
        frames = 0;
        lastTime = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div id="debug-info">
      {Object.entries(sourceConnections).filter(([source]) => source !== "kmaStn").map(([source, connected]) => (
        <div className="debug-info-block" key={source}>
          <p className="debug-info__title">{SOURCE_LABELS[source] ?? source}:</p>
          <p className="debug-info__label" style={{ color: connected ? "#51ff00" : "#ff0303" }}>
            {connected ? t("connected") : t("disconnected")}
          </p>
        </div>
      ))}
      <div className="debug-info-block">
        <p className="debug-info__title">{t("version")}:</p>
        <p className="debug-info__label" style={{ color: updateAvailable ? "#ff0303" : "#077fe9ff" }}>{version}</p>
      </div>
      {updateAvailable && (
        <div className="debug-info-block">
          <p className="debug-info__label" style={{ color: "#ff0303" }}>
            {t("updateAvailable", { version: latestVersion })}
          </p>
        </div>
      )}
      <div className="debug-info-block">
        <p className="debug-info__title">{t("fps")}:</p>
        <p
          className={`debug-info__label${fps === null ? " debug-info__unknown-color" : ""}`}
          style={fps === null ? undefined : { color: "#077fe9ff" }}
        >
          {fps ?? t("unknown")}
        </p>
      </div>
    </div>
  );
};
