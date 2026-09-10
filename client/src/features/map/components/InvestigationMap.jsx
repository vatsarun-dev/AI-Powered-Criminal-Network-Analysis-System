import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

const createMarkerIcon = (selected = false) =>
  L.divIcon({
    className: "investigation-marker-wrapper",
    html: `<div class="investigation-marker ${selected ? "selected" : ""}"><span></span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });

const coordinatesFor = (location) => {
  const latitude = Number(
    location?.properties?.latitude ?? location?.properties?.lat,
  );
  const longitude = Number(
    location?.properties?.longitude ??
      location?.properties?.lng ??
      location?.properties?.lon,
  );
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
};

function MapFocus({ selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    const coordinates = coordinatesFor(selectedLocation);
    if (coordinates) {
      map.flyTo([coordinates.latitude, coordinates.longitude], 15, {
        duration: 0.8,
      });
    }
  }, [map, selectedLocation]);

  return null;
}

export default function InvestigationMap({
  locations = [],
  selectedLocation,
  onLocationSelect,
}) {
  const mappableLocations = locations.flatMap((location) => {
    const coordinates = coordinatesFor(location);
    return coordinates ? [{ location, ...coordinates }] : [];
  });

  if (!mappableLocations.length) {
    return (
      <div className="crime-map-empty">
        No evidence location has verified coordinates.
      </div>
    );
  }

  return (
    <MapContainer
      center={[mappableLocations[0].latitude, mappableLocations[0].longitude]}
      zoom={12}
      className="investigation-map"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocus selectedLocation={selectedLocation} />
      {mappableLocations.map(({ location, latitude, longitude }) => {
        const isSelected = selectedLocation?.id === location.id;
        const name =
          location.properties?.name ||
          location.properties?.location_name ||
          "Unknown Location";

        return (
          <Marker
            key={location.id}
            position={[latitude, longitude]}
            icon={createMarkerIcon(isSelected)}
            eventHandlers={{ click: () => onLocationSelect?.(location) }}
          >
            <Popup className="investigation-popup">
              <div className="map-popup">
                <span className="map-popup-label">LOCATION</span>
                <strong>{name}</strong>
                <div className="map-popup-coordinates">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
