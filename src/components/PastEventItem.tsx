import { getColor, getTextColor, getTextIntensity } from "../lib/transform";
import { timestampToTime } from "../lib/time";
import { useAppStore } from "../store";
import type { EqData } from "../lib/wsTypes";

export const PastEventItem = ({ event }: { event: EqData }) => {
  const badgeColor = getColor(event.intensity.number, event.intensity.type);
  const panelMode = useAppStore((s) => s.panelMode);
  const setSelectedEventId = useAppStore((s) => s.setSelectedEventId);
  const setPanelMode = useAppStore((s) => s.setPanelMode);

  const handleClick = () => {
    setSelectedEventId(event.id);
    if (panelMode === "auto") setPanelMode("past");
  };

  return (
    <div className="past-event" onClick={handleClick}>
      <div className="past-event__intensity">
        <span
          className="past-event__seismic-intensity-value"
          style={{ backgroundColor: badgeColor, color: getTextColor(event.intensity.number, event.intensity.type) }}
        >
          {getTextIntensity(event.intensity.number, event.intensity.type)}
        </span>
      </div>

      <div className="past-event__details">
        <span className="past-event__location">{event.location}</span>
        <span className="past-event__time">{timestampToTime(event.time)}</span>
      </div>

      <span className="past-event__magnitude">M{event.mag.toFixed(1)}</span>
      <span className="past-event__agency">{event.agency.toUpperCase()}</span>
    </div>
  );
};
