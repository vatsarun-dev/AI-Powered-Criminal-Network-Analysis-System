import { useEffect, useState } from "react";
import Timeline from "../../features/timeline/components/Timeline";
import InvestigationMap from "../../features/map/components/InvestigationMap";
import { getEntityConnections } from "../../features/timeline/api";
import { useInvestigationStore } from "../../store/investigationStore";
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
  return;
}

    const loadConnections = async () => {
      try {
        setLoading(true);

        const data = await getEntityConnections(entityId);

        setConnections(data?.data || data || []);
      } catch (error) {
        console.error("Failed to load investigation data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, [entityId]);

  const activeConnections = entityId ? connections : [];

  const locations = activeConnections
    .flatMap((item) => [
      item.source,
      item.target,
    ])
    .filter(
      (node, index, array) =>
        node?.labels?.includes("LOCATION") &&
        array.findIndex((item) => item?.id === node?.id) === index
    );

  return (
    <div className="investigation-page">
      <header className="investigation-header">
        <div>
          <span className="eyebrow">INVESTIGATION</span>
          <h1>Timeline / Map</h1>
        </div>

        {loading && <span>Loading...</span>}
      </header>

      <div className="investigation-grid">
        <section className="investigation-panel timeline-panel">
          <div className="panel-header">
            <h2>Timeline</h2>
            <span>{activeConnections.length} connections</span>
          </div>

          <Timeline
            connections={activeConnections}
            selectedEvent={selectedEvent}
            onEventSelect={setSelectedEvent}
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
            onLocationSelect={setSelectedLocation}
          />
        </section>
      </div>
    </div>
  );
};

export default Investigation;
