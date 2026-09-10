import { useEffect, useState } from "react";

import Timeline from "../../features/timeline/components/Timeline";
import InvestigationMap from "../../features/map/components/InvestigationMap";

import { getEntityConnections } from "../../features/timeline/api";

import { useInvestigationStore } from "../../store/investigationStore";

import "../../styles/investigation.css";

const Investigation = () => {
  const [connections, setConnections] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedEntity = useInvestigationStore(
    (state) => state.selectedEntity
  );

  const entityId = selectedEntity?.id;

  useEffect(() => {
    if (!entityId) {
      setConnections([]);
      setSelectedEvent(null);
      setSelectedLocation(null);
      return;
    }

    const loadConnections = async () => {
      try {
        setLoading(true);

        const response = await getEntityConnections(entityId);

        const data = response?.data || response || [];

        setConnections(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          "Failed to load investigation data:",
          error
        );

        setConnections([]);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [entityId]);

  /*
   * Extract unique LOCATION nodes from graph connections
   */
  const locations = connections
    .flatMap((connection) => [
      connection.source,
      connection.target,
    ])
    .filter((node) => node?.labels?.includes("LOCATION"))
    .filter(
      (node, index, array) =>
        array.findIndex(
          (item) => item?.id === node?.id
        ) === index
    );

  /*
   * Timeline event → Map location
   */
  const handleEventSelect = (event) => {
    setSelectedEvent(event);

    const eventLocation =
      event.properties?.location ||
      event.properties?.location_name;

    if (!eventLocation) return;

    const relatedLocation = locations.find((location) => {
      const locationName =
        location.properties?.name ||
        location.properties?.location_name;

      return locationName === eventLocation;
    });

    if (relatedLocation) {
      setSelectedLocation(relatedLocation);
    }
  };

  /*
   * Map location → Timeline event
   */
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);

    const locationName =
      location.properties?.name ||
      location.properties?.location_name;

    if (!locationName) return;

    const relatedEvent = connections
      .flatMap((connection) => {
        const source = connection.source;
        const target = connection.target;

        const event = source?.labels?.includes("EVENT")
          ? source
          : target?.labels?.includes("EVENT")
          ? target
          : null;

        return event ? [event] : [];
      })
      .find((event) => {
        const eventLocation =
          event.properties?.location ||
          event.properties?.location_name;

        return eventLocation === locationName;
      });

    if (relatedEvent) {
      setSelectedEvent(relatedEvent);
    }
  };

  return (
    <div className="investigation-page">
      <header className="investigation-header">
        <div>
          <span className="eyebrow">
            INVESTIGATION
          </span>

          <h1>Timeline / Map</h1>

          {selectedEntity && (
            <div className="selected-investigation-entity">
              <span>{selectedEntity.type}</span>

              <strong>{selectedEntity.label}</strong>
            </div>
          )}
        </div>

        {loading && (
          <span className="mono">
            LOADING...
          </span>
        )}
      </header>

      <div className="investigation-grid">
        {/* TIMELINE */}
        <section className="investigation-panel timeline-panel">
          <div className="panel-header">
            <h2>Timeline</h2>

            <span>
              {connections.length} connections
            </span>
          </div>

          <Timeline
            connections={connections}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
          />
        </section>

        {/* MAP */}
        <section className="investigation-panel map-panel">
          <div className="panel-header">
            <h2>Map</h2>

            <span>
              {locations.length} locations
            </span>
          </div>

          <InvestigationMap
            locations={locations}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
          />
        </section>
      </div>
    </div>
  );
};

export default Investigation;