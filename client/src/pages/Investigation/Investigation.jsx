import { useEffect, useState } from "react";

import InvestigationMap from "../../features/map/components/InvestigationMap";
import RagPanel from "../../features/rag/components/RagPanel";
import { getEntityConnections } from "../../features/timeline/api";
import Timeline from "../../features/timeline/components/Timeline";
import { useInvestigationStore } from "../../store/investigationStore";
import "../../styles/investigation.css";

const locationName = (location) =>
  location?.properties?.name || location?.properties?.location_name;

const uniqueLocations = (connections) =>
  connections
    .flatMap((connection) => [connection.source, connection.target])
    .filter((node) => node?.labels?.includes("LOCATION"))
    .filter(
      (node, index, nodes) =>
        nodes.findIndex((item) => item?.id === node.id) === index,
    );

const eventForLocation = (connections, targetLocationName) =>
  connections
    .flatMap((connection) => [connection.source, connection.target])
    .filter(
      (node, index, nodes) =>
        node?.labels?.includes("EVENT") &&
        nodes.findIndex((item) => item?.id === node.id) === index,
    )
    .find(
      (event) =>
        (event.properties?.location || event.properties?.location_name) ===
        targetLocationName,
    );

export default function Investigation() {
  const [connections, setConnections] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedEntity = useInvestigationStore((state) => state.selectedEntity);
  const entityId = selectedEntity?.id;

  useEffect(() => {
    let current = true;

    if (!entityId) {
      return () => {
        current = false;
      };
    }

    void (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getEntityConnections(entityId);
        if (current) setConnections(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (!current) return;
        setConnections([]);
        setError(
          requestError.response?.data?.message ||
            "Unable to load investigation connections.",
        );
      } finally {
        if (current) setLoading(false);
      }
    })();

    return () => {
      current = false;
    };
  }, [entityId]);

  const activeConnections = entityId ? connections : [];
  const locations = uniqueLocations(activeConnections);

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    const eventLocation =
      event.properties?.location || event.properties?.location_name;
    if (!eventLocation) return;
    const matchingLocation = locations.find(
      (location) => locationName(location) === eventLocation,
    );
    if (matchingLocation) setSelectedLocation(matchingLocation);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    const matchingEvent = eventForLocation(
      activeConnections,
      locationName(location),
    );
    if (matchingEvent) setSelectedEvent(matchingEvent);
  };

  return (
    <div className="investigation-page">
      <header className="investigation-header">
        <div>
          <span className="eyebrow">INVESTIGATION</span>
          <h1>Timeline / Map</h1>
          {selectedEntity ? (
            <div className="selected-investigation-entity">
              <span>{selectedEntity.type}</span>
              <strong>{selectedEntity.label}</strong>
            </div>
          ) : null}
        </div>
        {loading ? <span className="mono">LOADING...</span> : null}
      </header>

      {error ? (
        <p className="investigation-error" role="alert">
          {error}
        </p>
      ) : null}
      {!entityId ? (
        <p className="investigation-empty">
          Select an entity from the dashboard or graph to inspect its timeline
          and locations.
        </p>
      ) : null}

      <RagPanel entityId={entityId} />

      <div className="investigation-grid">
        <section className="investigation-panel timeline-panel">
          <div className="panel-header">
            <h2>Timeline</h2>
            <span>{activeConnections.length} connections</span>
          </div>
          <Timeline
            connections={activeConnections}
            selectedEvent={selectedEvent}
            onEventSelect={handleEventSelect}
          />
        </section>
        <section className="investigation-panel map-panel">
          <div className="panel-header">
            <h2>Map</h2>
            <span>{locations.length} locations</span>
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
}
