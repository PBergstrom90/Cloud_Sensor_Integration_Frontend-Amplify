import React from "react";
import { Box, Typography } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import moment from "moment";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface WeatherMapProps {
  selectedStation: {
    latitude?: number;
    longitude?: number;
    stationName?: string;
    stationKey?: string;
  } | null;
  weatherData: Array<{
    stationKey: string;
    temperature?: number | null;
    timestamp?: number | null;
  }>;
}

const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const WeatherMap: React.FC<WeatherMapProps> = ({
  selectedStation,
  weatherData,
}) => {
  const defaultLatitude = 59.3293; // Default to Stockholm
  const defaultLongitude = 18.0686;

  const stationTemperature = weatherData
    .filter((data) => data.stationKey === selectedStation?.stationKey)
    .slice(-1)[0]?.temperature || "N/A";

  const stationTimestamp = weatherData
    .filter((data) => data.stationKey === selectedStation?.stationKey)
    .slice(-1)[0]?.timestamp;

  const formattedTimestamp = stationTimestamp
    ? moment.unix(stationTimestamp).format("HH.mm")
    : "N/A";

  return (
    <Box
      sx={{
        mt: 3,
        mb: 3,
        width: "60%",
        maxWidth: "1100px",
        borderRadius: "8px",
        background: "#1a1a2e",
        alignContent: "center",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          textAlign: "center",
          padding: "10px",
          color: "#fff",
        }}
      >
        Weather Station Map
      </Typography>
      <MapContainer
        center={[
          selectedStation?.latitude || defaultLatitude,
          selectedStation?.longitude || defaultLongitude,
        ]}
        zoom={10}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {selectedStation ? (
          <Marker
            position={[
              selectedStation.latitude || defaultLatitude,
              selectedStation.longitude || defaultLongitude,
            ]}
            icon={customIcon}
          >
            <Popup>
              <strong>Station:</strong> {selectedStation?.stationName || "N/A"}{" "}
              <br />
              <strong>Temperature:</strong> {stationTemperature} °C <br />
              <strong>Last Update:</strong> {formattedTimestamp}
            </Popup>
          </Marker>
        ) : (
          <Marker
            position={[defaultLatitude, defaultLongitude]}
            icon={customIcon}
          >
            <Popup>No weather data available</Popup>
          </Marker>
        )}
      </MapContainer>
    </Box>
  );
};

export default WeatherMap;