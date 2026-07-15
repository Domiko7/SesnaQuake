import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getColor, getTextColor, getTextIntensity } from "../lib/transform";
import { getSettings } from "../lib/settings";
import { computeHomeImpact } from "../lib/homeImpact";
import { assetUrl } from "../lib/assetUrl";
import type { EventDisplay } from "../lib/useEventDisplay";

interface ShakingExpectedBoxProps {
  display: EventDisplay | undefined;
}

const SCALE_LABEL_KEYS: Record<string, string> = {
  shindo: "shakingExpectedScaleShindo",
  mmi: "shakingExpectedScaleMmi",
  csis: "shakingExpectedScaleCsis",
  cwasis: "shakingExpectedScaleCwasis",
};

const formatArrival = (sec: number | null): string => (sec === null ? "--" : `${Math.max(0, Math.round(sec))}s`);

export const ShakingExpectedBox = ({ display }: ShakingExpectedBoxProps) => {
  const { t } = useTranslation();
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (!display || !display.isEew) return null;

  const intensityType = getSettings().alertIntensityType;
  const impact = computeHomeImpact(display.lat, display.lon, display.mag, display.depth, display.time, intensityType);

  if (impact.intensity < 1) return null;

  return (
    <div id="shaking-expected-box" style={{borderColor: getColor(impact.intensity, impact.intensityType)}}>
      <div 
        className="shaking-expected-box__header"
        style={{backgroundColor: getColor(impact.intensity, impact.intensityType)}}
      >
        <span 
          className="shaking-expected-box__title"
          style={{color: getTextColor(impact.intensity, impact.intensityType)}}
        >{t("shakingExpectedTitle")}</span>
      </div>
      <div className="shaking-expected-box__body">
        <div
          className="shaking-expected-box__intensity"
          style={{
            backgroundColor: getColor(impact.intensity, impact.intensityType),
            color: getTextColor(impact.intensity, impact.intensityType),
          }}
        >
          <span className="shaking-expected-box__intensity-label">{t("shakingExpectedMaxIntensity")}</span>
          <span className="shaking-expected-box__intensity-value">{getTextIntensity(impact.intensity, impact.intensityType)}</span>
          <span className="shaking-expected-box__intensity-scale">{t(SCALE_LABEL_KEYS[impact.intensityType])}</span>
        </div>
        <div className="shaking-expected-box__details">
          <div className="shaking-expected-box__row">
            <span>{t("shakingExpectedDistance")}</span>
            <span>{`${impact.distanceKm.toFixed(1)}km`}</span>
          </div>
          <div className="shaking-expected-box__row">
            <span>{t("depth")}</span>
            <span>{`${display.depth.toFixed(1)}km`}</span>
          </div>
          <div className="shaking-expected-box__row">
            <span>{t("shakingExpectedPWave")}</span>
            <span className="shaking-expected-box__arrival">{formatArrival(impact.pArrivalSec)}</span>
          </div>
          <div className="shaking-expected-box__row">
            <span>{t("shakingExpectedSWave")}</span>
            <span className="shaking-expected-box__arrival shaking-expected-box__arrival--s">{formatArrival(impact.sArrivalSec)}</span>
          </div>
        </div>
        <img className="shaking-expected-box__warning" src={assetUrl("images/AlertTriangle.svg")} alt="" />
      </div>
    </div>
  );
};
