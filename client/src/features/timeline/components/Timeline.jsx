import { useMemo } from "react";
import TimelineItem from "./TimelineItem";

const Timeline = ({ connections = [], selectedEvent, onEventSelect }) => {
  const events = useMemo(() => {
    const result = [];

    connections.forEach((connection) => {
      const nodes = [connection.source, connection.target];

      nodes.forEach((node) => {
        if (!node?.labels?.includes("EVENT")) return;

        const properties = node.properties || {};

        if (!result.some((event) => event.id === node.id)) {
          result.push({
            id: node.id,
            name:
              properties.name ||
              properties.title ||
              properties.event ||
              "Investigation Event",
            timestamp:
              properties.timestamp ||
              properties.date ||
              properties.datetime ||
              properties.time ||
              null,
            location:
              properties.location ||
              properties.location_name ||
              null,
            properties,
          });
        }
      });
    });

    return result.sort((a, b) => {
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;

      return (
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
      );
    });
  }, [connections]);

  if (!events.length) {
    return (
      <div className="timeline-empty">
        <p>NO TIMELINE EVENTS</p>
        <span>
          Events will appear when graph relationships are available.
        </span>
      </div>
    );
  }

  return (
    <div className="timeline">
      {events.map((event) => (
        <TimelineItem
          key={event.id}
          event={event}
          active={selectedEvent?.id === event.id}
          onClick={onEventSelect}
        />
      ))}
    </div>
  );
};

export default Timeline;