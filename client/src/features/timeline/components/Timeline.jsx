import { useMemo } from "react";
import TimelineItem from "./TimelineItem";

const Timeline = ({ connections = [], selectedEvent, onEventSelect }) => {
  const events = useMemo(() => {
    return connections
      .filter((item) => {
        const sourceType = item.source?.labels?.[0];
        const targetType = item.target?.labels?.[0];

        return sourceType === "EVENT" || targetType === "EVENT";
      })
      .map((item) => {
        const event =
          item.source?.labels?.[0] === "EVENT"
            ? item.source
            : item.target;

        return {
          ...event,
          timestamp:
            event.properties?.timestamp ||
            event.properties?.date ||
            event.properties?.time ||
            null,

          location:
            event.properties?.location ||
            event.properties?.location_name ||
            null,
        };
      });
  }, [connections]);

  if (!events.length) {
    return (
      <div className="timeline-empty">
        <p>No timeline events found.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {events.map((event, index) => (
        <TimelineItem
          key={`${event.id}-${index}`}
          event={event}
          active={selectedEvent?.id === event.id}
          onClick={onEventSelect}
        />
      ))}
    </div>
  );
};

export default Timeline;