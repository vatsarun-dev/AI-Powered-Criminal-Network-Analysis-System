import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

const createMarkerIcon = (selected = false) =>
  L.divIcon({
    className: "investigation-marker-wrapper",
    html: `
      <div class="investigation-marker ${selected ? "selected" : ""}">
        <span></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });

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
        {
          duration: 0.8,
        }
      );
    const latitude = Number(selectedLocation?.properties?.latitude ?? selectedLocation?.properties?.lat);
    const longitude = Number(
      selectedLocation?.properties?.longitude ??
      selectedLocation?.properties?.lng ??
      selectedLocation?.properties?.lon,
    );
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      map.flyTo([latitude, longitude], 15, { duration: 1 });
    }
  }, [selectedLocation, map]);

  return null;
};

const InvestigationMap = ({
  locations = [],
  selectedLocation,
  onLocationSelect,
}) => {
  const mappableLocations = locations.flatMap((location) => {
    const latitude = Number(location.properties?.latitude ?? location.properties?.lat);
    const longitude = Number(
      location.properties?.longitude ?? location.properties?.lng ?? location.properties?.lon,
    );
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [{ location, latitude, longitude }]
      : [];
  });

  if (!mappableLocations.length) {
    return <div className="crime-map-empty">No evidence location has verified coordinates.</div>;
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
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        const isSelected =
          selectedLocation?.id === location.id;

        const locationName =
          location.properties?.name ||
          location.properties?.location_name ||
          "Unknown Location";

      {mappableLocations.map(({ location, latitude, longitude }) => {
        return (
          <Marker
            key={location.id}
            position={[latitude, longitude]}
            icon={createMarkerIcon(isSelected)}
            eventHandlers={{
              click: () => {
                onLocationSelect?.(location);
              },
            }}
          >
            <Popup className="investigation-popup">
              <div className="map-popup">
                <span className="map-popup-label">
                  LOCATION
                </span>

                <strong>{locationName}</strong>

                <div className="map-popup-coordinates">
                  {latitude.toFixed(5)},{" "}
                  {longitude.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default InvestigationMap;
