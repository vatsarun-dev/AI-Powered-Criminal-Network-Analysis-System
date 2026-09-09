import { Clock3, MapPin } from "lucide-react";

const TimelineItem = ({ event, active, onClick }) => {
  return (
    <button
      type="button"
      className={`timeline-item ${active ? "active" : ""}`}
      onClick={() => onClick(event)}
    >
      <div className="timeline-dot" />

      <div className="timeline-content">
        <div className="timeline-time">
          <Clock3 size={14} />
          {event.timestamp || "Unknown time"}
        </div>

        <h4>{event.name || event.type || "Event"}</h4>

        {event.location && (
          <div className="timeline-location">
            <MapPin size={13} />
            {event.location}
          </div>
        )}
      </div>
    </button>
  );
};

export default TimelineItem;