import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import moment from "moment";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { type Schema } from "../amplify/data/resource";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import 'react-perfect-scrollbar/dist/css/styles.css';
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SelectField } from '@aws-amplify/ui-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Custom Leaflet Marker Icon to fix missing icon issue - For the Map
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface WeatherStation {
  stationKey: string;
  stationName: string;
  latitude: number;
  longitude: number;
}

const client = generateClient<Schema>();

function App() {
  const [telemetries, setTelemetry] = useState<Array<Schema["telemetry"]["type"]>>([]);
  const [devices, setDevices] = useState<Array<Schema["devices"]["type"]>>([]);
  const [weatherData, setWeatherData] = useState<Array<Schema["weatherData"]["type"]>>([]);
  const [selectedStation, setSelectedStation] = useState<WeatherStation | null>(null);
  
  const {user, signOut } = useAuthenticator();
  const [isLoading, setIsLoading] = useState(false);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  useEffect(() => {
    client.models.weatherData.observeQuery().subscribe({
      next: (data) => setWeatherData([...data.items]),
    });
  }, []);

  useEffect(() => {
    client.models.telemetry.observeQuery().subscribe({
      next: (data) => setTelemetry([...data.items]),
    });
    client.models.devices.observeQuery().subscribe({
      next: (data) => setDevices([...data.items]),
    });
  }, []);

  const createDevice = () => {
    const device = String(window.prompt("Device ID"));
    if (device) {
      client.models.devices.create({ device_id: device, owner: user.userId });
    }
  };
  
  const deleteDevice = (device_id: string) => {
    client.models.devices.delete({ device_id });
  };

  const deleteTelemetry = (device_id: string, timestamp: number) => {
    client.models.telemetry.delete({ device_id, timestamp });
  };

  const createStation = () => {
    const newStationKey = String(window.prompt("Enter a new Station Key"));
    if (newStationKey) {
      client.models.weatherStation
        .create({ stationKey: newStationKey, owner: user.userId })
        .then(() => {
          console.log("Weather station created successfully.");
          setSnackbarMessage("Weather station created successfully!");
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
    })
    .catch((error) => {
      setSnackbarMessage("Error creating weather station. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      console.error("Error creating weather station:", error);
    });
    }
  };

const fetchWeatherData = async () => {
  const API_GATEWAY_URL =
    "https://4b2wryytb8.execute-api.eu-central-1.amazonaws.com/default/amplify-d3c0g3rqfmqtvl-ma-smhiWeatherTelemetrylamb-sZKmSo6ygs8m";
    setIsLoading(true);
  try {
    if (!selectedStation?.stationKey) {
      throw new Error("No station selected. Please select a station.");
    }
    const payload = { stationKey: selectedStation.stationKey };
    const response = await fetch(API_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Weather data fetched:", data);
    
    // Ensure data is an array
     if (!Array.isArray(data)) {
      throw new Error("Unexpected response format: Weather data is not an array.");
    }

    setWeatherData(data);
    setSnackbarMessage("Weather data fetched successfully!");
    setSnackbarSeverity("success")
    console.log("Weather data fetch triggered successfully.");
  } catch (error) {
    if (error instanceof Error) {
      setSnackbarMessage(error.message || "Failed to fetch weather data.");
    }
    setSnackbarSeverity("error");
    console.error("Error fetching weather data:", error);
  } finally {
    setIsLoading(false);
    setSnackbarOpen(true);
  }
};
  
  const chartData = {
    labels: Array.isArray(telemetries)
    ? telemetries.map((data) => moment(data?.timestamp).format("HH:mm:ss"))
    : [],
  datasets: [
    {
      label: "Temperature",
      data: Array.isArray(telemetries)
        ? telemetries.map((data) => data?.temperature)
        : [],
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.3)",
        fill: true, 
        tension: 0.4,
        pointStyle: "circle", 
        pointRadius: 4, 
        pointHoverRadius: 8,
        yAxisID: "y",
      },
      {
        label: "Humidity",
        data: Array.isArray(telemetries)
        ? telemetries.map((data) => data?.humidity)
        : [],
        borderColor: "rgba(99, 255, 132, 1)",
        backgroundColor: "rgba(99, 255, 132, 0.3)",
        fill: true,
        tension: 0.4,
        pointStyle: "rectRot",
        pointRadius: 4,
        pointHoverRadius: 8,
        yAxisID: "y1",
      },
    ],
  };
  
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    onClick: function (evt: any, element: string | any[]) {
      evt;
      if (element.length > 0) {
        var ind = element[0].index;
        deleteTelemetry(telemetries[ind].device_id, telemetries[ind].timestamp)
      }
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`,
        },
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
      },
      title: {
        display: true,
        text: telemetries[0]?.device_id
          ? `Device ID: ${telemetries[0]?.device_id}`
          : "Telemetry Data",
        font: {
          size: 15,
          weight: "normal",
        },
        color: "#fff", 
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        grid: {
          color: "rgba(255, 99, 132, 0.2)",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
    },
    animation: {
      duration: 1000, 
      easing: "easeOutQuart",
    },
  };

  const smhiChartData = {
    labels: Array.isArray(weatherData)
      ? weatherData
          .filter((data) => data.stationKey === selectedStation?.stationKey)
          .map((data) => moment.unix(data?.timestamp).format("HH:mm:ss"))
      : [],
    datasets: [
      {
        label: "Temperature",
        data: Array.isArray(weatherData)
          ? weatherData
              .filter((data) => data.stationKey === selectedStation?.stationKey)
              .map((data) => data?.temperature)
          : [],
        borderColor: "rgba(54, 162, 235, 1)", // Blue
        backgroundColor: "rgba(54, 162, 235, 0.3)", // Light Blue
        fill: true,
        tension: 0.4,
        pointStyle: "circle",
        pointRadius: 4,
        pointHoverRadius: 8,
      },
    ],
  };
  
  const smhiChartOptions: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (tooltipItem) =>
            `${tooltipItem.dataset.label}: ${tooltipItem.raw}°C`,
        },
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 12,
        },
      },
      title: {
        display: true,
        text: "SMHI Weather Data",
        font: {
          size: 15,
          weight: "normal",
        },
        color: "#fff",
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        grid: {
          color: "rgba(54, 162, 235, 0.2)",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#ddd",
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  };
  
  return (
    <Box p={6} sx={{ 
      display: "flex", 
      flexDirection: "column", 
      flexShrink: 0,
      alignItems: "center" 
      }}>
<Snackbar
  open={snackbarOpen}
  autoHideDuration={3000} // Closes after 3 seconds
  onClose={() => setSnackbarOpen(false)}
  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
>
<Alert
onClose={() => setSnackbarOpen(false)}
severity={snackbarSeverity}
sx={{ width: "80%" }}
  >
  {snackbarMessage}
</Alert>
</Snackbar>
      {/* Overview Section */}
      <Card sx={{ 
        mb: 3, 
        width: "100%",
        backgroundColor: "#1a1a2e", 
        maxWidth: "1100px", 
        display: "flex", 
        justifyContent: "center", 
        margin: "0auto", 
        alignItems: "center" }}>
        <CardContent>
          <Typography variant="h4" gutterBottom textAlign="center" fontFamily="inherit">
            Overview
          </Typography>
          <Box
          sx={{
          mb: 1,
          display: "flex",
          flexDirection: "line",
          margin: "0auto",
          justifyContent: "space-around",
          gap: 15,
          alignItems: "center",
          textAlign: "center",
        }}
    >
      <Box textAlign="center">
        <Typography variant="h5">User</Typography>
        <Typography variant="body1">{user?.signInDetails?.loginId || "N/A"}</Typography>
      </Box>
      <Box textAlign="center">
        <Typography variant="h5">Temperature</Typography>
        <Typography variant="body1">
          {telemetries[telemetries.length - 1]?.temperature || "N/A"} °C
        </Typography>
      </Box>
      <Box textAlign="center">
        <Typography variant="h5">Humidity</Typography>
        <Typography variant="body1">
          {telemetries[telemetries.length - 1]?.humidity || "N/A"} %
        </Typography>
      </Box>
    </Box>
  </CardContent>
</Card>

<Box>
    {isLoading && (
      <Box sx={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
        <CircularProgress color="primary" />
      </Box>
      )}
</Box>

{/* Devices Section */}
<Box sx={{ 
  mb: 3, 
  width: "100%",
  maxWidth: "900px", 
  flexGrow: 1,
  overflow: "hidden",
  margin: "0auto" }}>
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
            <Typography variant="h6">
              Device ID: {device.device_id}
            </Typography>
            <Typography sx={{ mt: 0.5 }}>
              Last Seen:{" "}
              {moment(telemetries[telemetries.length - 1]?.timestamp).fromNow()}
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
  
{/* Telemetry Chart Section */}
<Card sx={{ 
  mb: 3, 
  width: "100%", 
  maxWidth: "1100px", 
  backgroundColor: "#1a1a2e", 
  color: "#fff" }}>
  <CardContent>
    <Typography variant="h5" gutterBottom textAlign="center">
      Live Telemetry Data
    </Typography>
    <Line data={chartData} options={chartOptions} />
  </CardContent>
</Card>

{/* SMHI Weather Data Chart Section */}
{Array.isArray(weatherData) && weatherData.length > 0 ? (
  <Card
    sx={{
      mb: 3,
      width: "80%",
      maxWidth: "1100px",
      backgroundColor: "#1a1a2e",
      color: "#fff",
    }}
  >
    <CardContent>
      <div style={{ color: "white" }}>
        <label style={{ color: "white" }}>Select Weather Station</label>
        <SelectField
          label=""
          disabled={isLoading}
          placeholder="Please select a station"
          options={["97200", "98230", "71420"]}
          value={selectedStation?.stationKey || ""}
          onChange={(e) => {
            const selectedKey = e.target.value;
            const selectedWeatherData = weatherData.find(
              (data) => data.stationKey === selectedKey
            );
            if (selectedWeatherData) {
              setSelectedStation({
                stationKey: selectedWeatherData.stationKey,
                stationName: selectedWeatherData.stationName || "Unknown Station",
                latitude: selectedWeatherData.latitude ?? 0,
                longitude: selectedWeatherData.longitude ?? 0,
              });
            }
          }}
        ></SelectField>
      </div>
      <Typography variant="subtitle1" textAlign="center">
        Station: {selectedStation?.stationName || "N/A"} <br />
        Location 'latitude': {selectedStation?.latitude}, 'longitude':{" "}
        {selectedStation?.longitude}
      </Typography>
      <Line data={smhiChartData} options={smhiChartOptions} />
    </CardContent>
  </Card>
) : (
  <Card
    sx={{
      mb: 3,
      width: "60%",
      maxWidth: "1100px",
      backgroundColor: "#1a1a2e",
      color: "#fff",
      textAlign: "center",
      padding: "20px",
    }}
  >
    <Typography variant="h6" color="error">
      No weather data available. Please fetch data or select a valid station.
    </Typography>
  </Card>
)}

{/* Map Section */}
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
      selectedStation?.latitude || 59.3293,
      selectedStation?.longitude || 18.0686,
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
    selectedStation?.latitude || 0,
    selectedStation?.longitude || 0,
    ]}
    icon={customIcon}
    >
  <Popup>
  <strong>Station:</strong> {selectedStation?.stationName || "N/A"} <br />
  <strong>Temperature:</strong> {weatherData.filter((data) => data.stationKey === selectedStation?.stationKey)
  .slice(-1)[0]?.temperature || "N/A"}{" "}°C <br />
  <strong>Last Update:</strong>{" "}{weatherData.filter((data) => data.stationKey === selectedStation?.stationKey).slice(-1)[0]?.timestamp
  ? moment.unix(weatherData.filter((data) => data.stationKey === selectedStation?.stationKey).slice(-1)[0]?.timestamp).format("HH.mm.ss"): "N/A"}
  </Popup>
</Marker>
    ) : (
    <Marker position={[59.3293, 18.0686]} icon={customIcon}>
    <Popup>No weather data available</Popup>
    </Marker>
    )}
  </MapContainer>
</Box>


{/* Action Buttons */}

<Button onClick={createStation} variant="contained" color="primary">
Create Weather Station
</Button>

<Button
variant="contained"
color="primary"
disabled={isLoading}
onClick={fetchWeatherData}
>
{isLoading ? <CircularProgress size={20} /> : "Fetch SMHI Weather Data"}
</Button>

{/* Sign Out Button */}
<Button variant="contained" color="secondary" 
sx={{ 
  width: "100%", 
  maxWidth: "200px", 
  textAlign: "center" }} 
onClick={signOut}>
      Sign Out
    </Button>
  </Box>
);
}
export default App;