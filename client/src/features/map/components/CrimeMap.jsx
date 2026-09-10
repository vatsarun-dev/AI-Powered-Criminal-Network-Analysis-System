import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const validCoordinates = (location) => {
  const latitude = Number(location.coordinates?.latitude);
  const longitude = Number(location.coordinates?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude);
};

const MapBounds = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(points, { padding: [36, 36], maxZoom: 13 });
  }, [map, points]);

  return null;
};

const markerRadius = (caseCount, maximum) => {
  if (maximum <= 1) return 12;
  return 8 + ((caseCount / maximum) * 20);
};

const markerColor = (caseCount, maximum) => {
  const ratio = maximum <= 1 ? 1 : caseCount / maximum;
  if (ratio > 0.66) return "#f97316";
  if (ratio > 0.33) return "#eab308";
  return "#84cc16";
};

export default function CrimeMap({ locations, groupBy, onLocationSelect }) {
  const mappableLocations = locations.filter(validCoordinates);
  const points = mappableLocations.map((location) => [
    Number(location.coordinates.latitude),
    Number(location.coordinates.longitude),
  ]);
  const maximum = Math.max(...locations.map((location) => location.caseCount), 1);

  if (!mappableLocations.length) {
    return (
      <div className="crime-map-empty" role="status">
        No verified {groupBy === "DISTRICT" ? "district" : "police station"} coordinates
        are available for the current FIR filters.
      </div>
    );
  }

  return (
    <MapContainer center={points[0]} zoom={11} className="crime-map-canvas" scrollWheelZoom>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBounds points={points} />
      {mappableLocations.map((location) => (
        <CircleMarker
          key={location.id}
          center={[location.coordinates.latitude, location.coordinates.longitude]}
          radius={markerRadius(location.caseCount, maximum)}
          pathOptions={{
            color: markerColor(location.caseCount, maximum),
            fillColor: markerColor(location.caseCount, maximum),
            fillOpacity: 0.56,
            weight: 2,
          }}
          eventHandlers={{ click: () => onLocationSelect(location) }}
        >
          <Popup>
            <strong>{location.name}</strong>
            <br />
            {location.caseCount} historical case{location.caseCount === 1 ? "" : "s"}
            {location.unlocatedCaseCount > 0 && (
              <><br />{location.unlocatedCaseCount} record(s) without a verified coordinate</>
            )}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
