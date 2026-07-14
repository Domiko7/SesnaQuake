import { useAppStore } from "../store";
import { PastEventItem } from "./PastEventItem";

export const PastEvents = () => {
  const pastEvents = useAppStore((s) => s.pastEvents);
  const sortedEvents = [...pastEvents].sort((a, b) => b.time - a.time);

  return (
    <div id="info">
      <div id="info-panel">
        <div className="past-events">
          {sortedEvents.map((event) => (
            <PastEventItem key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
};
