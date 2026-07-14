import { useTranslation } from "react-i18next";
import { getColor, getTextColor, getTextIntensity } from "../lib/transform";
import { timestampToTime } from "../lib/time";
import type { EventDisplay } from "../lib/useEventDisplay";

interface EventPanelProps {
  display: EventDisplay | undefined;
}

export const EventPanel = ({ display }: EventPanelProps) => {
  const { t } = useTranslation();

  return (
    <div id="realtime-info">
      <div id="event-panel">
        <div className="event-panel__header">
          <span className="event-panel__title"
          style={display ? {
            color: getTextColor(display.intensity.number, display.intensity.type),
          } : undefined}
          >{display ? display.title : t("eewInactive")}</span>
          <span className={`event-panel__report-label${display?.isEew ? "" : " transparent"}`}>{t("reportNumber")}</span>
          <span className={`event-panel__report-value${display?.isEew ? "" : " transparent"}`}>
            {display?.isEew ? `#${display.reportNumber}` : ""}
          </span>
        </div>
        <div className={`event-panel__content${display ? "" : " transparent"}`}>
          <div className="event-panel__intensity">
            <span className="event-panel__seismic-intensity-label">{t("intensity")}</span>
            <span
              className="event-panel__seismic-intensity-value"
              style={display ? {
                backgroundColor: getColor(display.intensity.number, display.intensity.type),
                color: getTextColor(display.intensity.number, display.intensity.type),
              } : undefined}
            >
              {display ? getTextIntensity(display.intensity.number, display.intensity.type) : ""}
            </span>
          </div>
          <div className="event-panel__details">
            <span className="event-panel__location">{display ? display.location : ""}</span>
            <span className="event-panel__time">{display ? timestampToTime(display.time) : ""}</span>
            <div className="event-panel__info">
              <span className="event-panel__magnitude">{display ? `M${display.mag.toFixed(1)}` : ""}</span>
              <span className="event-panel__depth">{display ? `${display.depth}km` : ""}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
