import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import { AuthUser } from "@aws-amplify/auth";

interface DeviceOverviewProps {
  user: AuthUser | null;
  telemetries: Array<{ temperature?: number | null; humidity?: number | null }> | null;
  isLoading: boolean;
}

const DeviceOverview: React.FC<DeviceOverviewProps> = ({
  user,
  telemetries,
  isLoading,
}) => {
  const latestTelemetry = telemetries?.[telemetries.length - 1] || {
    temperature: "N/A",
    humidity: "N/A",
  };

  return (
    <>
      <Card
        sx={{
          mb: 3,
          width: "100%",
          backgroundColor: "#1a1a2e",
          maxWidth: "1100px",
          display: "flex",
          justifyContent: "center",
          margin: "0 auto",
          alignItems: "center",
        }}
      >
        <CardContent>
          <Typography
            variant="h4"
            gutterBottom
            textAlign="center"
            fontFamily="inherit"
          >
            Device Overview
          </Typography>
          <Box
            sx={{
              mb: 1,
              display: "flex",
              flexDirection: "line",
              margin: "0 auto",
              justifyContent: "space-around",
              gap: 15,
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box textAlign="center">
              <Typography variant="h5">User</Typography>
              <Typography variant="body1">
                {user?.signInDetails?.loginId || "N/A"}
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5">Temperature</Typography>
              <Typography variant="body1">
                {latestTelemetry.temperature !== null &&
                latestTelemetry.temperature !== undefined
                  ? `${latestTelemetry.temperature} °C`
                  : "N/A"}
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h5">Humidity</Typography>
              <Typography variant="body1">
                {latestTelemetry.humidity !== null &&
                latestTelemetry.humidity !== undefined
                  ? `${latestTelemetry.humidity} %`
                  : "N/A"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
      {isLoading && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      )}
    </>
  );
};

export default DeviceOverview;