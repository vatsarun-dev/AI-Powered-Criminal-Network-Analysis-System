import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const MapFocus = ({ selectedLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (
      selectedLocation?.latitude != null &&
      selectedLocation?.longitude != null
    ) {
      map.flyTo(
        [selectedLocation.latitude, selectedLocation.longitude],
        15,
        { duration: 1 }
      );
    }
  }, [selectedLocation, map]);

  return null;
};

const InvestigationMap = ({
  locations = [],
  selectedLocation,
  onLocationSelect,
}) => {
  const defaultCenter = [28.6139, 77.209];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      className="investigation-map"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFocus selectedLocation={selectedLocation} />

      {locations.map((location) => {
        const latitude = Number(
          location.properties?.latitude ??
            location.properties?.lat
        );

        const longitude = Number(
          location.properties?.longitude ??
            location.properties?.lng ??
            location.properties?.lon
        );

        if (
          Number.isNaN(latitude) ||
          Number.isNaN(longitude)
        ) {
          return null;
        }

        return (
          <Marker
            key={location.id}
            position={[latitude, longitude]}
            eventHandlers={{
              click: () => onLocationSelect?.(location),
            }}
          >
            <Popup>
              <strong>
                {location.properties?.name || "Location"}
              </strong>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default InvestigationMap;