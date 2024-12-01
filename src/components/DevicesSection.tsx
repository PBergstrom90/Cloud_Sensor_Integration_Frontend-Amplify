import React from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import moment from "moment";

interface Device {
  device_id: string;
  status: string;
}

interface Telemetry {
  timestamp?: number;
}

interface DevicesSectionProps {
  devices: Device[];
  telemetries: Telemetry[];
  createDevice: () => void;
  deleteDevice: (deviceId: string) => void;
}

const DevicesSection: React.FC<DevicesSectionProps> = ({
  devices,
  telemetries,
  createDevice,
  deleteDevice,
}) => {
  const lastTelemetryTimestamp = telemetries[telemetries.length - 1]?.timestamp;

  return (
    <Box
      sx={{
        mb: 3,
        width: "100%",
        maxWidth: "900px",
        flexGrow: 1,
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      <Typography variant="h4" gutterBottom textAlign="left">
        Devices
      </Typography>
      <Box display="flex" justifyContent="left" mb={2}>
        <Button variant="contained" color="primary" onClick={createDevice}>
          Add Device
        </Button>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          justifyContent: "left",
        }}
      >
        {devices.map((device, index) => (
          <Box
            key={index}
            sx={{
              width: "100%",
              maxWidth: "300px",
              flex: "1 1 calc(33.333% - 16px)",
              display: "flex",
            }}
          >
            <Card sx={{ width: "100%", backgroundColor: "#1b1b1b" }}>
              <CardContent>
                <Typography variant="h6">Device ID: {device.device_id}</Typography>
                <Typography sx={{ mt: 0.5 }}>
                  Last Seen:{" "}
                  {lastTelemetryTimestamp
                    ? moment(lastTelemetryTimestamp).fromNow()
                    : "N/A"}
                </Typography>
                <Typography sx={{ mt: 1 }}>
                  Status:{" "}
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor:
                        device.status === "connected" ? "green" : "red",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                    }}
                  >
                    {device.status === "connected" ? "Connected" : "Disconnected"}
                  </Box>
                </Typography>
                <Button
                  sx={{ mt: 2 }}
                  variant="outlined"
                  color="secondary"
                  onClick={() => deleteDevice(device.device_id)}
                >
                  Delete Device
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
export default DevicesSection;